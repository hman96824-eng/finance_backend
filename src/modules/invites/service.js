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

const userRepo = new Repository(UserModel);
const inviteRepo = new Repository(InviteModel);
const roleRepo = new Repository(RoleModel);

export const getAllInvitedUsers = async (acceptedFilter) => {
  let filter = {};

  if (acceptedFilter === "true") filter.accepted = true;
  else if (acceptedFilter === "false") filter.accepted = false;

  const invites = await inviteRepo.findWithPopulate(filter, ["role_id"]);

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

  return formattedData;
};
export const createInvite = async (name, email, roleName) => {
  const cleanEmail = email.trim().toLowerCase();

  const existUser = await userRepo.findOne({ email: cleanEmail });
  if (existUser) throw ApiError.unauthorized(messages.USER_ALREADY_EXISTS);
 

  // 🔹 Step 1: Find role by name
  const role = await RoleModel.findOne({ name: roleName });
  if (!role) {
    throw new Error(`Role '${roleName}' not found`);
  }

  // 🔹 Step 2: Check existing invite
  let invite = await inviteRepo.findOne({ email: cleanEmail });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  if (invite) {
    invite.name = name; // ✅ Update name if needed
    invite.token = token;
    invite.expiresAt = expiresAt;
    invite.invite += 1;
    invite.role_id = role._id;
    invite.status = "pending";
    await invite.save();
  } else {
    invite = await inviteRepo.create({
      name,
      email: cleanEmail,
      role_id: role._id,
      token,
      expiresAt,
    });
  }

  const { html, plainText } = templates.generateTeamInviteTemplate(
    invite.token,
    role.name,
    email,
    name
  );

  await sendEmail({
    to: email,
    subject: `Invitation to join Onu as ${role.name}`,
    html,
    text: plainText,
  });

  return invite;
};
export const registerUser = async (inviteToken, userData) => {
  const { phone, password, confirmPassword } = userData;
  if (!password || password !== confirmPassword)
    throw ApiError.unauthorized(messages.PASSWORD_INVALID);

  const invite = await inviteRepo.findOne({ token: inviteToken });
  if (!invite) throw ApiError.unauthorized(messages.TOKEN_INVALID);
  if (!invite.expiresAt || invite.expiresAt < new Date())
    throw ApiError.badRequest(messages.TOKEN_EXPIRED);

  const role = await roleRepo.findById(invite.role_id);
  if (!role) throw ApiError.unauthorized(messages.ROLE_NOT_FOUND);

  const existingUser = await userRepo.findOne({ email: invite.email });
  if (existingUser && invite.accepted)
    throw ApiError.unauthorized(messages.USER_ALREADY_EXISTS);

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
