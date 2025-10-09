import roleService from "./service.js";
import messages from "../../constants/messages.js";
import { successResponse } from "../../utils/response.helper.js";

// ================== ADD ROLE ==================
export const addRole = async (req, res, next) => {
    try {
        const { name, description, permissions } = req.body;

        const newRole = await roleService.addRole({ name, description, permissions, });

        return successResponse(res, newRole);
    } catch (error) {
        next(error);
    }
};
export const getAllRoles = async (req, res, next) => {
    try {
        const roles = await roleService.getAllRoles();
        return successResponse(res, roles,);
    } catch (error) {
        next(error);
    }
};
export const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, permissions } = req.body;

        const updatedRole = await roleService.updateRole(id, {
            name,
            description,
            permissions,
        });

        return successResponse(res, updatedRole);
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


export default {
    addRole,
    getAllRoles,
    updateRole,
    deleteRole,
};
