import messages from "../../constants/messages.js";
import ApiError from "../../utils/ApiError.js";
import Repository from "../../utils/repository.js";
import { RoleModel } from "./model.js";

const roleRepo = new Repository(RoleModel);

export const addRole = async ({ name, description, permissions }) => {
  const existingRole = await roleRepo.findOne({ name });
  if (existingRole) throw ApiError.badRequest(messages.ROLE_ALREADY_EXISTS);

  const newRole = await roleRepo.create({
    name,
    description: description || "",
    permissions: permissions || [],
  });

  return newRole;
};
export const getAllRoles = async () => {
  const roles = await roleRepo.find({});

  return roles;
};
// services/roleService.js
export const updateRole = async (id, updateData) => {
  const { permissions } = updateData;

  const role = await roleRepo.findById(id);
  if (!role) throw ApiError.notFound(messages.ROLE_NOT_FOUND, 404);

  // ✅ Replace mode — permissions reflect exactly what's selected in frontend
  if (Array.isArray(permissions)) {
    // Clean and normalize the array
    const normalized = permissions.map((p) => p.trim()).filter((p) => p !== "");

    role.permissions = normalized;
  }

  await role.save();
  return role;
};

export const deleteRole = async (id) => {
  const role = await roleRepo.findById(id);
  if (!role) throw ApiError.notFound(messages.ROLE_NOT_FOUND, 404);
  console.log(role.name.toLowerCase(), "user role name ");

  if (role.name.toLowerCase() === "admin") {
    throw ApiError.badRequest("Admin role cannot be deleted");
  }
  await roleRepo.deleteById(id);
  return true;
};

export const getRoleById = async (id) => {
  const role = await roleRepo.findById(id);

  if (!role) {
    throw ApiError.notFound(messages.ROLE_NOT_FOUND);
  }
  return role;
};

export const updateRoleInfo = async (id, { name, description }) => {
  const updated = await roleRepo.updateById(
    id,
    {
      name,
      ...(description !== undefined && { description }), // only update if provided
    },
    { new: true } // return updated document
  );

  return updated;
};

export default {
  addRole,
  getAllRoles,
  updateRole,
  deleteRole,
  getRoleById,
  updateRoleInfo,
};
