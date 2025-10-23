import { UserModel } from "../user/model.js";
import { EmployeeModel } from "./model.js";
import { DepartmentModel } from "../department/model.js";
import { SalaryModel } from "../salary/model.js";
import { RoleModel } from "../role/model.js";
import ApiError from "../../utils/ApiError.js";
import Repository from "../../utils/repository.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// 🟢 Repository instances
const employeeRepository = new Repository(EmployeeModel);
const userRepository = new Repository(UserModel);
const departmentRepository = new Repository(DepartmentModel);
const salaryRepository = new Repository(SalaryModel);
const roleRepository = new Repository(RoleModel);

// 🔹 Helper function: Generate Employee Code
async function generateEmployeeCode() {
    const lastEmployee = await EmployeeModel.findOne().sort({ createdAt: -1 }).lean();
    if (!lastEmployee || !lastEmployee.employeeCode) {
        return "EMP001";
    }

    const lastCodeNumber = parseInt(lastEmployee.employeeCode.replace("EMP", ""), 10);
    const newCodeNumber = lastCodeNumber + 1;
    const formattedNumber = String(newCodeNumber).padStart(3, "0");
    return `EMP${formattedNumber}`;
}

const employeeService = {
    // --------------------------------------------------
    // 🟢 Create Employee (User + Employee + Salary + Dept)
    // --------------------------------------------------
    createEmployee: async (data) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        // Track created documents in case we need to manually cleanup
        const created = {
            department: null,
            salary: null,
            user: null,
            employee: null,
        };

        try {
            const {
                name,
                email,
                // password,
                phoneNumber,
                cnic,
                address,
                department,
                designation,
                employeeType,
                startEmployeeDate,
                endEmployeeDate,
                contractType,
                contractStartDate,
                contractEndDate,
                salaryIncome,
                salaryStartDate,
                salaryEndDate,
                emergencyContactName,
                relation,
                emergencyContactPhone,
                rating,
                remarks,
                avatar,
            } = data;

            // 0️⃣ Validation: ensure required fields
            if (!email) throw ApiError.validationError("Email is required");
            // if (!password) throw ApiError.validationError("Password is required");

            // Pre-check: user with same email must not exist
            const existingUser = await UserModel.findOne({ email }).session(session);
            if (existingUser) {
                throw ApiError.conflict("User with this email already exists");
            }

            // 1️⃣ Find or create department
            let dept = await DepartmentModel.findOne({ name: department }).session(session);
            if (!dept) {
                const [newDept] = await DepartmentModel.create([{
                    departmentName: department,
                    designation: designation,
                }], { session });
                dept = newDept;
                created.department = dept;
            } else {
                created.department = null; // existing
            }

            // 2️⃣ Create salary document
            const [salaryDoc] = await SalaryModel.create(
                [
                    {
                        salaryIncome: salaryIncome,
                        salaryStartDate: salaryStartDate,
                        salaryEndDate: salaryEndDate,
                    },
                ],
                { session }
            );
            if (!salaryDoc?._id) throw new Error("Salary creation failed — no ID returned");
            created.salary = salaryDoc;

            // 3️⃣ Hash password
            // const hashedPassword = await bcrypt.hash(password, 10);
            const employeeRole = await RoleModel.findOne({ name: "EMPLOYEE" });
            if (!employeeRole) throw ApiError.notFound("Employee role not found");

            // 4️⃣ Create user
            const [userDoc] = await UserModel.create(
                [
                    {
                        name,
                        email,
                        // password: hashedPassword,
                        phone: phoneNumber,
                        role_id: employeeRole._id,
                        cnic,
                        address,
                        department: dept._id,
                        salary: salaryDoc._id,
                        avatar: avatar || null,
                    },
                ],
                { session }
            );
            if (!userDoc?._id) throw new Error("User creation failed — no ID returned");
            created.user = userDoc;

            // 5️⃣ Generate employee code (EMP001, EMP002, etc.)
            const employeeCode = await generateEmployeeCode();

            // 6️⃣ Create employee record
            const [employeeDoc] = await EmployeeModel.create(
                [
                    {
                        user: userDoc._id,
                        department: dept._id,
                        salary: salaryDoc._id,
                        employeeType,
                        employeeCode,
                        startEmployeeDate: startEmployeeDate || new Date(),
                        endEmployeeDate,


                        // ✅ Nested object for contract details
                        contractDetails: {
                            contractType,
                            contractStartDate,
                            contractEndDate,
                            noticePeriodDays: 30,
                        },

                        // ✅ Optional array for relations (emergency contact)
                        relations: emergencyContactName
                            ? [
                                {
                                    name: emergencyContactName,
                                    relation,
                                    phone: emergencyContactPhone,
                                },
                            ]
                            : [],

                        // ✅ Optional performance feedback
                        performanceFeedback:
                            rating || remarks
                                ? [
                                    {
                                        reviewDate: new Date(),
                                        rating: rating || undefined,
                                        comments: remarks || undefined,
                                        reviewedBy: userDoc._id,
                                    },
                                ]
                                : [],
                    },
                ],
                { session }
            );


            created.employee = employeeDoc;

            // 7️⃣ Update user with employee reference
            await UserModel.findByIdAndUpdate(
                userDoc._id,
                { employee: employeeDoc._id },
                { session }
            );
            await session.commitTransaction();
            session.endSession();

            // Fetch the newly created user and return a single populated object
            const createdUser = await UserModel.findById(userDoc._id)
                .populate({
                    path: "employee",
                    populate: [
                        {
                            path: "performanceFeedback.reviewedBy",
                            select: "name email",
                        },
                    ],
                })
                .populate("salary")
                .populate("department")
                .populate("role_id", "name")
                // .select("-password -resetCode -resetCodeExpires");

            return createdUser;
        } catch (error) {
            // Abort transaction if active
            try {
                if (session.inTransaction()) await session.abortTransaction();
            } catch (e) {
                console.error("Error aborting transaction:", e);
            }

            // Manual cleanup for anything created outside of an atomic commit
            try {
                // If employee created but not fully committed
                if (created.employee && created.employee._id) {
                    await EmployeeModel.deleteOne({ _id: created.employee._id });
                }
                if (created.user && created.user._id) {
                    await UserModel.deleteOne({ _id: created.user._id });
                }
                if (created.salary && created.salary._id) {
                    await SalaryModel.deleteOne({ _id: created.salary._id });
                }
                // Only delete department if we created it in this flow
                if (created.department && created.department._id) {
                    await DepartmentModel.deleteOne({ _id: created.department._id });
                }
            } catch (cleanupErr) {
                console.error("Error during manual cleanup:", cleanupErr);
            } finally {
                session.endSession();
            }

            console.error("❌ Error in createEmployee:", error);
            // If it's already an ApiError, rethrow
            if (error instanceof ApiError) throw error;
            throw ApiError.internal(error.message || "Error creating employee");
        }
    },

    // --------------------------------------------------
    // 🟡 Get All Employees
    // --------------------------------------------------
    // --------------------------------------------------
    // 🟡 Get All Employees (Complete Details)
    // --------------------------------------------------
    getAllEmployees: async () => {
        // 1️⃣ Find the employee role document
        const employeeRole = await RoleModel.findOne({ name: "EMPLOYEE" });
        if (!employeeRole) throw ApiError.notFound("Employee role not found");

        // 2️⃣ Fetch all users having role_id = EMPLOYEE role
        const employees = await UserModel.find({ role_id: employeeRole._id })
            .populate({
                path: "employee",
                populate: [
                    {
                        path: "performanceFeedback.reviewedBy",
                        select: "name email",
                    },
                ],
            })
            .populate("salary") // get salary details
            .populate("department") // get department details
            .populate("role_id", "name") // get only role name
            // .select("-password -resetCode -resetCodeExpires"); // hide sensitive fields

        // 3️⃣ If no employees found
        if (!employees || employees.length === 0) {
            throw ApiError.notFound("No employees found");
        }

        // 4️⃣ Return response
        return employees;
    },


    // --------------------------------------------------
    // 🟣 Get Employee by ID
    // --------------------------------------------------
    async getEmployeeById(id) {
        // Use direct model query (nested populate supported) to avoid calling populate on Promise
        const user = await UserModel.findById(id)
            .populate({
                path: "employee",
                populate: [
                    { path: "performanceFeedback.reviewedBy", select: "name email" },
                ],
            })
            .populate("department")
            .populate("role_id");

        if (!user) throw ApiError.notFound("Employee not found");
        return user;
    },

    // --------------------------------------------------
    // 🔵 Update Employee
    // --------------------------------------------------
    async updateEmployee(id, updateData) {
        const user = await userRepository.findById(id);
        if (!user) throw ApiError.notFound("User not found");

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await userRepository.updateById(id, updateData, { session, new: true });

            if (updateData.employee && user.employee) {
                await employeeRepository.updateById(user.employee, updateData.employee, { session, new: true });
            }

            if (updateData.salary && user.salary) {
                await salaryRepository.updateById(user.salary, updateData.salary, { session, new: true });
            }

            await session.commitTransaction();

            const updatedUser = await userRepository.findById(id)
                .populate({
                    path: "employee",
                    populate: [{ path: "performanceFeedback.reviewedBy", select: "name email" }],
                })
                .populate("department")
                .populate("role_id");

            return updatedUser;
        } catch (error) {
            if (session.inTransaction()) await session.abortTransaction();
            throw new ApiError(500, error.message || "Error updating employee");
        } finally {
            session.endSession();
        }
    },
};

export default employeeService;
