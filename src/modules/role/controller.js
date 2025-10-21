import roleService from "./service.js";
import messages from "../../constants/messages.js";
import { successResponse } from "../../utils/response.helper.js";

// ================== ADD ROLE ==================
export const addRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    const newRole = await roleService.addRole({
      name,
      description,
      permissions,
    });

    return successResponse(res, newRole);
  } catch (error) {
    next(error);
  }
};
export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();
    return successResponse(res, roles);
  } catch (error) {
    next(error);
  }
};
// controllers/roleController.js
export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // validate
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Permissions must be an array",
      });
    }
    // Ensure array of non-empty strings
    const invalid = permissions.some(
      (p) => typeof p !== "string" || p.trim() === ""
    );
    if (invalid) {
      return res.status(400).json({
        success: false,
        message: "Permissions array must contain non-empty strings only",
      });
    }

    const updatedRole = await roleService.updateRole(id, { permissions });

    return successResponse(res, updatedRole, "Role updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    await roleService.deleteRole(id);

    return successResponse(res, messages.ROLE_DELETED);
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await roleService.getRoleById(id);
    return successResponse(res, role, "Role fetched successfully");
  } catch (error) {
    next(error);
  }
};

export default {
  addRole,
  getAllRoles,
  updateRole,
  deleteRole,
  getRoleById,
};
