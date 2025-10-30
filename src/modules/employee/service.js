import { EmployeeModel } from "./model.js";
import ApiError from "../../utils/ApiError.js";
import bcrypt from "bcrypt";
import Repository from "../../utils/repository.js"; // ⬅️ make sure this path is correct
import moment from "moment";


const EmpRepo = new Repository(EmployeeModel);
// 🔹 Generate Sequential Employee Code
const generateEmployeeCode = async () => {
    const lastEmployee = await EmployeeModel.findOne().sort({ createdAt: -1 });
    if (!lastEmployee || !lastEmployee.employeeCode) return "EMP-001";

    const number = parseInt(lastEmployee.employeeCode.split("-")[1], 10) + 1;
    return `EMP-${number.toString().padStart(3, "0")}`;
};

// make a variable in which check how much days are left for contract expiry
const checkContractExpiry = (endDate) => {
    const now = moment();
    const expiry = moment(endDate);
    return expiry.diff(now, "days");
};

// check the all user contract date if date is expired then these all employee status become expired
const ExpiringEmployees = async () => {
    try {
        const employees = await EmployeeModel.find();
        const expiredEmployees = employees.filter((employee) => {
            const daysLeft = checkContractExpiry(employee.contractDetails.contractEndDate);
            return daysLeft < 0;
        });

        if (expiredEmployees.length > 0) {
            await EmployeeModel.updateMany(
                { _id: { $in: expiredEmployees.map((emp) => emp._id) } },
                { status: "Expired" }
            );
        }
    } catch (error) {
        throw ApiError.badRequest(error.message);
    }
};

// the do the staus epired function call afatr every day
// setInterval(ExpiringEmployees, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
// for testing purpose run after every minute
// setInterval(ExpiringEmployees, 60 * 1000);


// make as funciton that check every second if the date is not expired then it status become active
const ReactivateEmployees = async () => {
    try {
        const employees = await EmpRepo.find();
        const reactivatableEmployees = employees.filter((employee) => {
            const daysLeft = checkContractExpiry(employee.contractDetails.contractEndDate);
            return daysLeft >= 0 && employee.status === "Expired";
        });

        if (reactivatableEmployees.length > 0) {
            await EmpRepo.updateMany(
                { _id: { $in: reactivatableEmployees.map((emp) => emp._id) } },
                { status: "Active" }
            );
        }

    } catch (error) {
        throw ApiError.badRequest(error.message);
    }
};
// call the reactivate function after every day
// setInterval(ReactivateEmployees, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
// for testing purpose run after every minute
setInterval(ReactivateEmployees, 1000); // 1 second in milliseconds




const EmployeeService = {
    // 🟢 CREATE EMPLOYEE
    createEmployee: async (data, avatarId = null) => {
        try {
            if (data.password) data.password = await bcrypt.hash(data.password, 10);

            const employee = await EmployeeModel.create({
                name: data?.name,
                email: data?.email,
                password: data?.password,
                role: data?.role || "EMPLOYEE",
                status: data?.status,
                phone: data?.phoneNumber,
                cnic: data?.cnic,
                addresses: data?.address,
                gender: data?.gender || "male",
                avatar: avatarId || null,
                salary: [
                    {
                        salaryStartDate: data?.salaryStartDate,
                        salaryEndDate: data?.salaryEndDate,
                        salaryIncome: data?.salaryIncome,
                    },
                ],
                department: {
                    departmentName: data?.department,
                    designation: data?.designation,
                },
                employeeCode: await generateEmployeeCode(),
                employeeType: data?.employeeType,
                startEmployeeDate: data?.startEmployeeDate,
                endEmployeeDate: data?.endEmployeeDate,
                contractDetails: {
                    contractType: data?.contractType,
                    contractStartDate: data?.contractStartDate,
                    contractEndDate: data?.contractEndDate,
                    noticePeriodDays: data?.noticePeriodDays || 30,
                },
                relations: {
                    name: data?.emergencyContactName,
                    relation: data?.relation,
                    phone: data?.emergencyContactPhone,
                },
                performanceFeedback: {
                    reviewDate: new Date(),
                    rating: data?.rating,
                    comments: data?.remarks,
                },
            });

            return await EmployeeModel.findById(employee._id).populate("avatar");
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    // 🟢 UPDATE EMPLOYEE
    updateEmployee: async (id, data, avatarId = null) => {
        try {
            // 1️⃣ Hash password if provided
            if (data.password) data.password = await bcrypt.hash(data.password, 10);
            if (avatarId) data.avatar = avatarId;

            // 2️⃣ Fetch existing employee
            const existingEmployee = await EmployeeModel.findById(id);
            if (!existingEmployee) throw ApiError.notFound("Employee not found");

            // 3️⃣ Get last salary entry
            const lastSalaryEntry = existingEmployee.salary?.at(-1);
            const currentSalary = lastSalaryEntry?.salaryIncome || 0;

            const newSalary = Number(data?.salary?.[0]?.salaryIncome) || 0;
            const incrementAmount = newSalary - currentSalary;

            // 4️⃣ Prepare new salary record (only if valid fields exist)
            const lastIndex = data?.salary?.length - 1;
            const newSalaryRecord =
                data?.salary?.[lastIndex]?.salaryIncome &&
                    data?.salary?.[lastIndex]?.salaryStartDate &&
                    data?.salary?.[lastIndex]?.salaryEndDate
                    ? {
                        salaryStartDate: data.salary[lastIndex].salaryStartDate,
                        salaryEndDate: data.salary[lastIndex].salaryEndDate,
                        salaryIncome: newSalary,
                        incrementAmount,
                    }
                    : null;

            // 5️⃣ Update employee data
            if (newSalaryRecord) {
                data.salary = [...(existingEmployee.salary || []), newSalaryRecord];
            }

            const updated = await EmployeeModel.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true }
            ).populate("avatar");

            if (!updated) throw ApiError.notFound("Employee not found");
            return updated;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    getAllEmployees: async (req, res, next) => {
        try {
            const employees = await EmployeeModel.find({
                status: { $in: ["Active", "Inactive"] },
            }).populate("avatar");

            // Add remaining days for each employee
            const data = employees.map((emp) => {
                const empObj = emp.toObject();
                empObj.contractRemainingDays = checkContractExpiry(emp.contractEndDate);
                return empObj;
            });

            return data;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    // 🟢 GET DELETED EMPLOYEES
    getAllDeletedEmployees: async () => {
        try {
            return await EmployeeModel.find({ status: "Deleted" }).populate("avatar");
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    // 🟢 GET BY ID
    getEmployeeById: async (id) => {
        try {
            const employee = await EmployeeModel.findById(id).populate("avatar");
            if (!employee) throw ApiError.notFound("Employee not found");
            return employee;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    // 🟢 SOFT DELETE
    softDeleteEmployee: async (id) => {
        try {
            const deleted = await EmployeeModel.findByIdAndUpdate(
                id,
                { status: "Deleted" },
                { new: true }
            ).populate("avatar");

            if (!deleted) throw ApiError.notFound("Employee not found");
            return deleted;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    // 🟢 HARD DELETE
    deleteEmployee: async (id) => {
        try {
            const deleted = await EmployeeModel.findByIdAndDelete(id);
            if (!deleted) throw ApiError.notFound("Employee not found");
            return deleted;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    // 🟢 DELETE MULTIPLE EMPLOYEES
    softDeleteManyUsers: async (userIds) => {
        try {
            let response = await EmpRepo.updateMany(
                { _id: { $in: userIds } },
                { $set: { status: "Deleted" } }
            );
            const updatedDocs = await EmpRepo.find({ _id: { $in: userIds } });
            return updatedDocs;
        } catch (error) {
            console.log(error?.message, "error");
        }
    },

    deleteManyArchivedUsers: async (userIds) => {
        try {
            if (userIds.length === 0) {
                throw new Error("userIds must be a non-empty array");
            }

            const result = await EmpRepo.deleteMany({ _id: { $in: userIds } });
            return result; // contains { acknowledged, deletedCount }
        } catch (error) {
            console.error("Error deleting invited users:", error.message);
            throw error;
        }
    },
};

export default EmployeeService;
