import { UserModel } from "../user/model.js";
import { EmployeeModel } from "./model.js";
import { DepartmentModel } from "../department/model.js";
import { SalaryModel } from "../salary/model.js";
import { RoleModel } from "../role/model.js";
import MediaModel from "../media/model.js";
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
const mediaRepository = new Repository(MediaModel);

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

// create the auto generated employee password and send this to the employee email save this password in the email also and store hashed password in the database
const generateEmployeePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    return password;
};

// send the email to the employee with the password
// const sendEmployeeEmail = async (email, password) => {
//     // use nodemailer or any other email service to send email
//     await sendEmail({
//         to: email,
//         subject: `Invitation to join Onu as ${role.name}`,
//         html,
//         text: plainText,
//     });
// };


const employeeService = {

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
            const password = generateEmployeePassword();
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
            if (!password) throw ApiError.validationError("Password is required");

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
            const hashedPassword = await bcrypt.hash(password, 10);
            const employeeRole = await RoleModel.findOne({ name: "EMPLOYEE" });
            if (!employeeRole) throw ApiError.notFound("Employee role not found");

            // 4️⃣ Create user
            const [userDoc] = await UserModel.create(
                [
                    {
                        name,
                        email,
                        password: hashedPassword,
                        phone: phoneNumber,
                        role_id: employeeRole._id,
                        cnic,
                        address,
                        department: dept._id,
                        salary: salaryDoc._id,
                        avatar: avatar ? {
                            url: (await mediaRepository.findById(avatar))?.url || null,
                            public_id: (await mediaRepository.findById(avatar))?.public_id || null,
                            default_letter: name.charAt(0).toUpperCase()
                        } : {
                            url: null,
                            public_id: null,
                            default_letter: name.charAt(0).toUpperCase()
                        },
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
                        employeeType: employeeType || "Full-time",
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

    getAllEmployees: async () => {
        // 1️⃣ Find the employee role document
        const employeeRole = await RoleModel.findOne({ name: "EMPLOYEE" });
        if (!employeeRole) throw ApiError.notFound("Employee role not found");

        // 2️⃣ Fetch all active users having role_id = EMPLOYEE role
        const employees = await UserModel.find({
            role_id: employeeRole._id,
            status: "active"  // only get users with active status
        })
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
            throw ApiError.notFound("No active employees found");
        }

        // 4️⃣ Return response
        return employees;
    },

    getEmployeeById: async (id) => {
        // Use direct model query (nested populate supported) to avoid calling populate on Promise
        const user = await UserModel.findById(id)
            .populate({
                path: "employee",
                populate: [
                    { path: "performanceFeedback.reviewedBy", select: "name email" },
                ],
            })
            .populate("salary")
            .populate("department")
            .populate("role_id", "name");

        if (!user) throw ApiError.notFound("Employee not found");
        return user;
    },

    updateEmployee: async (id, data) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const user = await UserModel.findById(id)
                .populate("employee")
                .populate("salary")
                .session(session);

            if (!user) throw ApiError.notFound("User not found");

            // Extract fields from request data
            const {
                name,
                email,
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

            // 1️⃣ Update or create department if needed
            let dept = await DepartmentModel.findOne({ departmentName: department }).session(session);
            if (!dept) {
                const [newDept] = await DepartmentModel.create(
                    [
                        {
                            departmentName: department,
                            designation: designation,
                        },
                    ],
                    { session }
                );
                dept = newDept;
            }

            // 2️⃣ Update salary
            if (user.salary) {
                await SalaryModel.findByIdAndUpdate(
                    user.salary,
                    {
                        salaryIncome,
                        salaryStartDate,
                        salaryEndDate,
                    },
                    { new: true, session }
                );
            }

            // 3️⃣ Update user info
            const userUpdate = {
                name,
                email,
                phone: phoneNumber,
                cnic,
                address,
                department: dept._id,
            };

            // ✅ Avatar update (if new uploaded)
            if (avatar) {
                const media = await mediaRepository.findById(avatar);
                if (media) {
                    userUpdate.avatar = {
                        url: media.url,
                        public_id: media.public_id,
                        default_letter: name.charAt(0).toUpperCase(),
                    };
                }
            }

            await UserModel.findByIdAndUpdate(id, userUpdate, { new: true, session });

            // 4️⃣ Update employee details
            if (user.employee) {
                const empUpdate = {
                    employeeType,
                    startEmployeeDate,
                    endEmployeeDate,
                    contractDetails: {
                        contractType,
                        contractStartDate,
                        contractEndDate,
                        noticePeriodDays: 30,
                    },
                    // ✅ Emergency contact
                    relations: emergencyContactName
                        ? [
                            {
                                name: emergencyContactName,
                                relation,
                                phone: emergencyContactPhone,
                            },
                        ]
                        : user.employee.relations || [],
                };

                // ✅ Performance feedback (append new review)
                if (rating || remarks) {
                    empUpdate.$push = {
                        performanceFeedback: {
                            reviewDate: new Date(),
                            rating: rating || undefined,
                            comments: remarks || undefined,
                            reviewedBy: id,
                        },
                    };
                }

                await EmployeeModel.findByIdAndUpdate(user.employee._id, empUpdate, {
                    new: true,
                    session,
                });
            }

            await session.commitTransaction();
            session.endSession();

            // 5️⃣ Return updated and populated user
            const updatedUser = await UserModel.findById(id)
                .populate({
                    path: "employee",
                    populate: [{ path: "performanceFeedback.reviewedBy", select: "name email" }],
                })
                .populate("salary")
                .populate("department")
                .populate("role_id", "name");

            return updatedUser;
        } catch (error) {
            if (session.inTransaction()) await session.abortTransaction();
            session.endSession();
            console.error("❌ Error in updateEmployee:", error);
            throw ApiError.internal(error.message || "Error updating employee");
        }
    },

    deleteEmployee: async (id) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1️⃣ Find the user and populate related documents
            const user = await UserModel.findById(id)
                .populate("employee")
                .populate("department")
                .populate("salary")
                .session(session);

            if (!user) throw ApiError.notFound("User not found");

            const employeeId = user.employee?._id;
            const departmentId = user.department?._id;
            const salaryId = user.salary?._id;

            // 2️⃣ Delete Employee document first
            if (employeeId) {
                await EmployeeModel.findByIdAndDelete(employeeId, { session });
            }

            // 3️⃣ Delete Salary document (if exists)
            if (salaryId) {
                await SalaryModel.findByIdAndDelete(salaryId, { session });
            }

            // 4️⃣ Delete Department (only if no other employees are using it)
            if (departmentId) {
                const otherUsers = await UserModel.find({ department: departmentId }).session(session);
                if (otherUsers.length <= 1) {
                    await DepartmentModel.findByIdAndDelete(departmentId, { session });
                }
            }

            // 5️⃣ Finally, delete User record
            await UserModel.findByIdAndDelete(id, { session });

            await session.commitTransaction();
            session.endSession();

            return { message: "Employee and related data deleted successfully" };
        } catch (error) {
            if (session.inTransaction()) await session.abortTransaction();
            session.endSession();
            console.error("❌ Error deleting employee:", error);
            throw ApiError.internal(error.message || "Error deleting employee");
        }
    },

    softDeleteEmployee: async (id) => {
        try {
            // 1️⃣ Find user and check if exists
            const user = await UserModel.findById(id);
            if (!user) throw ApiError.notFound("User not found");

            // 2️⃣ Soft delete logic — only update user status
            const userUpdate = {
                status: "deleted", // Change status to inactive instead of deleted
                updatedAt: new Date()
            };

            await UserModel.findByIdAndUpdate(id, userUpdate);

            return { message: "Employee status updated to deleted successfully" };
        } catch (error) {
            console.error("❌ Error updating employee status:", error);
            throw ApiError.internal(error.message || "Error updating employee status");
        }
    },

    getAllDeletedEmployees: async () => {
        try {
            // 1️⃣ Find the employee role document
            const employeeRole = await RoleModel.findOne({ name: "EMPLOYEE" });
            if (!employeeRole) throw ApiError.notFound("Employee role not found");

            // 2️⃣ Find all users with the employee role
            const employees = await UserModel.find({
                role: employeeRole._id,
                status: "deleted"
            }).populate("employee");

            return employees;
        } catch (error) {
            console.error("❌ Error fetching deleted employees:", error);
            throw ApiError.internal(error.message || "Error fetching deleted employees");
        }
    }

};

export default employeeService;
