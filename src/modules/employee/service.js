import { EmployeeModel } from "./model.js";
import ApiError from "../../utils/ApiError.js";
import bcrypt from "bcrypt";
import Repository from "../../utils/repository.js"; // ⬅️ make sure this path is correct

const EmpRepo = new Repository(EmployeeModel);
// 🔹 Generate Sequential Employee Code
const generateEmployeeCode = async () => {
  const lastEmployee = await EmployeeModel.findOne().sort({ createdAt: -1 });
  if (!lastEmployee || !lastEmployee.employeeCode) return "EMP-001";

  const number = parseInt(lastEmployee.employeeCode.split("-")[1], 10) + 1;
  return `EMP-${number.toString().padStart(3, "0")}`;
};

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
        status: data?.status || "active",
        phone: data?.phoneNumber,
        cnic: data?.cnic,
        addresses: data?.addresses,
        gender: data?.gender || "male",
        avatar: avatarId || null,
        salary: {
          salaryStartDate: data?.salaryStartDate,
          salaryEndDate: data?.salaryEndDate,
          salaryIncome: data?.salaryIncome,
        },
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
      if (data.password) data.password = await bcrypt.hash(data.password, 10);
      if (avatarId) data.avatar = avatarId;

      const updated = await EmployeeModel.findByIdAndUpdate(
        id,
        {
          $set: {
            name: data?.name,
            email: data?.email,
            phone: data?.phoneNumber,
            cnic: data?.cnic,
            addresses: data?.addresses,
            gender: data?.gender,
            avatar: avatarId || undefined,
            salary: {
              salaryStartDate: data?.salaryStartDate,
              salaryEndDate: data?.salaryEndDate,
              salaryIncome: data?.salaryIncome,
            },
            department: {
              departmentName: data?.department,
              designation: data?.designation,
            },
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
              rating: data?.rating,
              comments: data?.remarks,
            },
          },
        },
        { new: true }
      ).populate("avatar");

      if (!updated) throw ApiError.notFound("Employee not found");
      return updated;
    } catch (error) {
      throw ApiError.badRequest(error.message);
    }
  },

  // 🟢 GET ACTIVE + INACTIVE EMPLOYEES
  getAllEmployees: async () => {
    try {
      return await EmployeeModel.find({
        status: { $in: ["active", "inactive"] },
      }).populate("avatar");
    } catch (error) {
      throw ApiError.badRequest(error.message);
    }
  },

  // 🟢 GET DELETED EMPLOYEES
  getAllDeletedEmployees: async () => {
    try {
      return await EmployeeModel.find({ status: "deleted" }).populate("avatar");
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
        { status: "deleted" },
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
        { $set: { status: "deleted" } }
      );
      const updatedDocs = await EmpRepo.find({ _id: { $in: userIds } });
      return updatedDocs;
    } catch (error) {
      console.log(error?.message, "error");
    }
  },

  deleteManyArchivedUsers: async (userIds) => {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
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
