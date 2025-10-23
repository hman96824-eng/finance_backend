import employeeService from "./service.js";
import { successResponse, errorResponse } from "../../utils/response.helper.js";
import MediaService from "../media/service.js";

export const addEmployee = async (req, res, next) => {
    try {
        const userId = req.user?._id;

        // ✅ 1️⃣ Upload avatar if provided
        let media = null;
        if (req.file) {
            media = await MediaService.uploadMedia(req.file.path, "employee-avatars", userId);
        }

        // ✅ 2️⃣ Merge avatarId into req.body before service call
        const employeeData = {
            ...req.body,
            avatar: media?._id || null,
        };

        // ✅ 3️⃣ Call service (don’t touch your logic)
        const result = await employeeService.createEmployee(employeeData);

        // ✅ 4️⃣ Send unified response
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
// export const uploadEmployeeAvatar = async (req, res, next) => {
//     try {

//         const result = await employeeService.uploadEmployeeAvatar(req.params.id, req.file);
//         return successResponse(res, "Employee avatar uploaded successfully", result);
//     } catch (error) {
//         return errorResponse(res, error);
//     }
// };

export default {
    addEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
};