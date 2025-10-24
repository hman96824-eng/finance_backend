import roleService from "./service.js";
import messages from "../../constants/messages.js";
import { successResponse } from "../../utils/response.helper.js";
import ApiError from "../../utils/ApiError.js";

// ================== ADD ROLE ==================
export const addRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    const newRole = await roleService.addRole({
      name: name.toUpperCase(),
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
    if (!Array.isArray(permissions))
      ApiError.badRequest(messages.PERMISSION_TYPE_ERROR);
    // Ensure array of non-empty strings
    const invalid = permissions.some(
      (p) => typeof p !== "string" || p.trim() === ""
    );
    if (invalid) ApiError.badRequest(messages.PERMISSION_INVALID);

    const updatedRole = await roleService.updateRole(id, { permissions });

    return successResponse(res, updatedRole, messages.PERMISSION_ADDED);
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

export const updateRoleInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // ✅ Validation
    if (!name || typeof name !== "string")
      ApiError.badRequest(messages.ROLE_STRING);

    const updatedRole = await roleService.updateRoleInfo(id, {
      name,
      description,
    });

    if (!updatedRole) {
      return errorResponse(res, "Role not found", 404);
    }

    return successResponse(res, updatedRole, "Role updated successfully");
  } catch (error) {
    console.error("Error updating role info:", error);
    return errorResponse(res, error.message || "Failed to update role", 500);
  }
};

export default {
  addRole,
  getAllRoles,
  updateRole,
  deleteRole,
  getRoleById,
  updateRoleInfo,
};
