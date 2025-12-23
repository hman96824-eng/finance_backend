import EmployeeService from "./service.js";
import MediaService from "../media/service.js";
import ApiError from "../../utils/ApiError.js";
import messages from "../../constants/messages.js";
import { successResponse } from "../../utils/response.helper.js";

const EmpController = {
  // 🟢 Create Employee
  createEmployee: async (req, res, next) => {
    try {
      const userId = req.user?._id;
      let media = null;
      if (req.file) {
        media = await MediaService.uploadMedia(
          req.file.path,
          "employee-avatars",
          userId
        );
      }
      const employee = await EmployeeService.createEmployee(
        req.body,
        media?._id || null
      );
      res
        .status(200)
        .json(
          ApiError.ok(
            messages.EMPLOYEE_CREATED || "Employee created successfully",
            employee
          )
        );
    } catch (error) {
      next(error);
    }
  },

  // 🟢 Update Employee
  updateEmployee: async (req, res, next) => {
    try {
      const userId = req.user?._id;
      let media = null;
      if (req.file) {
        media = await MediaService.uploadMedia(
          req.file.path,
          "employee-avatars",
          userId
        );
      }
      const updated = await EmployeeService.updateEmployee(
        req.params.id,
        req.body,
        media?._id || null
      );


      res
        .status(200)
        .json(ApiError.ok("Employee updated successfully", updated));
    } catch (error) {
      next(error);
    }
  },

  getAllEmployees: async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const data = await EmployeeService.getAllEmployees(page, limit);
      return successResponse(res, data, "Employees fetched successfully");
    } catch (error) {
      next(error);
    }
  },

  getDeletedEmployees: async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const data = await EmployeeService.getAllDeletedEmployees(page, limit);
      return successResponse(res, data, "Deleted employees fetched successfully");
    } catch (error) {
      next(error);
    }
  },

  getEmployeeById: async (req, res, next) => {
    try {
      const employee = await EmployeeService.getEmployeeById(req.params.id);
      res
        .status(200)
        .json(ApiError.ok("Employee fetched successfully", employee));
    } catch (error) {
      next(error);
    }
  },

  softDeleteEmployee: async (req, res, next) => {
    try {
      const deleted = await EmployeeService.softDeleteEmployee(req.params.id);
      res.status(200).json(ApiError.ok("Employee soft deleted", deleted));
    } catch (error) {
      next(error);
    }
  },

  deleteEmployee: async (req, res, next) => {
    try {
      const deleted = await EmployeeService.deleteEmployee(req.params.id);
      res
        .status(200)
        .json(ApiError.ok("Employee deleted permanently", deleted));
    } catch (error) {
      next(error);
    }
  },
  deleteAllEmployees: async (req, res, next) => {
    try {
      const userIds = req.body;
      const { type } = req.query;



      // Call appropriate service
      let result;
      if (type === "active") {
        result = await EmployeeService.softDeleteManyUsers(userIds);
      } else if (type === "deleted") {
        result = await EmployeeService.deleteManyArchivedUsers(userIds);
      }



      return successResponse(res, result, messages.USER_DELETED);
    } catch (err) {
      next(err);
    }
  },
};

export default EmpController;
