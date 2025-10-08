import messages from "../../constants/messages.js";
import ApiError from "../../utils/ApiError.js";
import Repository from "../../utils/repository.js";
import { RoleModel } from "./model.js";

const roleRepo = new Repository(RoleModel)

export const addRole = async ({ name, description, permissions }) => {
    const existingRole = await roleRepo.findOne({ name });
    if (existingRole) throw ApiError.badRequest(messages.ROLE_ALREADY_EXISTS, 400)

    const newRole = await roleRepo.create({
        name,
        description,
        permissions: permissions || [],
    });

    return newRole;
};
export const getAllRoles = async () => {
    const roles = await roleRepo.find({});
    return roles;
};
export const updateRole = async (id, updateData) => {
    const role = await roleRepo.findById(id);
    if (!role) throw ApiError.notFound(messages.ROLE_NOT_FOUND, 404)

    const updatedRole = await roleRepo.updateById(id, updateData);
    return updatedRole;
};
export const deleteRole = async (id) => {
    const role = await roleRepo.findById(id);
    if (!role) throw new ApiError.notFound(messages.ROLE_NOT_FOUND, 404)

    await roleRepo.deleteById(id);
    return true;
};

export default {
    addRole,
    getAllRoles,
    updateRole,
    deleteRole,
};
