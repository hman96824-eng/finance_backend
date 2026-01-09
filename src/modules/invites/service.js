import { hashPassword } from "../../utils/bcrypt.helper.js";
import crypto from "crypto";
import Repository from "../../utils/repository.js";
import templates from "../../utils/templates/invitationEmail.js";
import ApiError from "../../utils/ApiError.js";
import { InviteModel } from "./model.js";
import { RoleModel } from "../role/model.js";
import { UserModel } from "../user/model.js";
import sendEmail from "../../utils/email.js";
import messages from "../../constants/messages.js";
import { EmployeeModel } from "../employee/model.js";

const userRepo = new Repository(UserModel);
const inviteRepo = new Repository(InviteModel);
const roleRepo = new Repository(RoleModel);

export const getAllInvitedUsers = async (acceptedFilter, page = 1, limit = 10, search = "") => {
  try {
    const skip = (Number(page) - 1) * Number(limit);
    let filter = {};

    if (acceptedFilter === "true") filter.accepted = true;
    else if (acceptedFilter === "false") filter.accepted = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const total = await InviteModel.countDocuments(filter);
    const invites = await InviteModel.find(filter)
      .populate("role_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const formattedData = invites.map((inv) => ({
      _id: inv._id,
      name: inv.name,
      email: inv.email,
      role_id: inv.role_id?.name,
      accepted: inv.accepted,
      inviteCount: inv.invite,
      expiresAt: inv.expiresAt,
      status: inv.status,
    }));

    return {
      data: formattedData,
      pagination: {
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        pageSize: Number(limit),
      },
    };
  } catch (error) {
    throw ApiError.badRequest(error.message);
  }
};
export const createInvite = async (email, roleName) => {
  const cleanEmail = email.trim().toLowerCase();

  const existUser = await userRepo.findOne({ email: cleanEmail });
  if (existUser) throw ApiError.badRequest(messages.USER_ALREADY_EXISTS);

  const checkemployee = await EmployeeModel.findOne({ email: cleanEmail });
  if (!checkemployee) throw ApiError.badRequest(messages.PLEASE_ADD_AS_EMPLOYEE);

  const role = await RoleModel.findOne({ name: roleName });
  if (!role) {
    throw ApiError.badRequest(`Role '${roleName}' not found`);
  }
  let invite = await inviteRepo.findOne({ email: cleanEmail });
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (invite) {
    Object.assign(invite, {
      name: checkemployee.name,
      token,
      expiresAt,
      role_id: role._id,
      accepted: false,
      status: "pending",
      invite: invite.invite + 1,
    });
    await invite.save();
  } else {
    invite = await inviteRepo.create({
      name: checkemployee.name,
      email: cleanEmail,
      role_id: role._id,
      token,
      expiresAt,
    });
  }
  const { html, plainText } =
    templates.generateTeamInviteTemplate(
      invite.token,
      role.name,
      email,
      checkemployee.name
    );
  await sendEmail({
    to: email,
    subject: `Invitation to join Invextech as ${role.name}`,
    html,
    text: plainText,
  });

  return invite;
};

export const registerUser = async (inviteToken, userData) => {
  const { phone, password, confirmPassword } = userData;
  if (!password || password !== confirmPassword)
    throw ApiError.badRequest(messages.PASSWORD_INVALID);

  const invite = await inviteRepo.findOne({ token: inviteToken });
  if (!invite) throw ApiError.badRequest(messages.TOKEN_INVALID);
  if (!invite.expiresAt || invite.expiresAt < new Date())
    throw ApiError.badRequest(messages.TOKEN_EXPIRED);

  const role = await roleRepo.findById(invite.role_id);
  if (!role) throw ApiError.badRequest(messages.ROLE_NOT_FOUND);

  const existingUser = await userRepo.findOne({ email: invite.email });
  if (existingUser && invite.accepted)
    throw ApiError.badRequest(messages.USER_ALREADY_EXISTS);

  const hashedPassword = await hashPassword(password);

  const newUser = await userRepo.create({
    name: invite.name,
    email: invite.email,
    phone,
    password: hashedPassword,
    role_id: role._id,
    status: "active",
  });

  invite.accepted = true;
  invite.token = null;
  invite.expiresAt = null;
  await invite.save();

  return {
    message: messages.SIGNUP_SUCCESS,
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: role.name,
    },
  };
};

export const updateInviteStatus = async (id) => {
  const invite = await inviteRepo.findOne({ _id: id });
  if (!invite) throw ApiError.notFound(messages.USER_NOT_FOUND);

  // Permanently delete the invite
  const deleted = await inviteRepo.deleteOne({ _id: id });

  return deleted;
};

export const deleteManyInvitedUsers = async (userIds) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("userIds must be a non-empty array");
    }

    const result = await inviteRepo.deleteMany({ _id: { $in: userIds } });
    return result; // contains { acknowledged, deletedCount }
  } catch (error) {
    console.error("Error deleting invited users:", error.message);
    throw error;
  }
};

export default {
  getAllInvitedUsers,
  createInvite,
  registerUser,
  updateInviteStatus,
  deleteManyInvitedUsers,
};
