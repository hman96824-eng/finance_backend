import employeeService from "./service.js";
import { successResponse, errorResponse } from "../../utils/response.helper.js";

export const addEmployee = async (req, res, next) => {
    try {
        const result = await employeeService.createEmployee(req.body);
        return successResponse(res, "Employee created successfully", result);
    } catch (error) {
        return errorResponse(res, error);
    }
};

export const getAllEmployees = async (req, res, next) => {
    try {
        const result = await employeeService.getAllEmployees();
        return successResponse(res, "Employees fetched successfully", result);
    } catch (error) {
        return errorResponse(res, error);
    }
};

export const getEmployeeById = async (req, res, next) => {
    try {
        const result = await employeeService.getEmployeeById(req.params.id);
        return successResponse(res, "Employee fetched successfully", result);
    } catch (error) {
        return errorResponse(res, error);
    }
};

export const updateEmployee = async (req, res, next) => {
    try {
        const result = await employeeService.updateEmployee(req.params.id, req.body);
        return successResponse(res, "Employee updated successfully", result);
    } catch (error) {
        return errorResponse(res, error);
    }
};

export default {
    addEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
};