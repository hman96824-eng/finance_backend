import bcrypt from "bcrypt";
import crypto from "crypto";
import Repository from "../../utils/repository.js";
import templates from "../../utils/templates/invitationEmail.js";
import ApiError from "../../utils/ApiError.js";
import { InviteModel } from "./model.js";
import { RoleModel } from "../role/model.js";
import { UserModel } from "../user/model.js";
import sendEmail from "../../utils/email.js";
import messages from "../../constants/messages.js";

// 🔹 Initialize repositories
const userRepo = new Repository(UserModel);
const inviteRepo = new Repository(InviteModel);
const roleRepo = new Repository(RoleModel);

/**
 * Get all invited users with optional accepted filter
 */
export const getAllInvitedUsers = async (acceptedFilter) => {
  let filter = {};

  if (acceptedFilter === "true") filter.accepted = true;
  else if (acceptedFilter === "false") filter.accepted = false;

  const invites = await inviteRepo.findWithPopulate(filter, ["role_id"]);

  const totalUsers = await inviteRepo.countAll();
  const totalAccepted = await inviteRepo.countByField({ accepted: true });
  const totalUnaccepted = await inviteRepo.countByField({ accepted: false });

  const formattedData = invites.map((inv) => ({
    name: inv.name,
    email: inv.email,
    role_id: inv.role_id?.name,
    accepted: inv.accepted,
    inviteCount: inv.invite,
    expiresAt: inv.expiresAt,
  }));

  return {
    message: "Invited users fetched successfully",
    totalUsers,
    totalAccepted,
    totalUnaccepted,
    filtered: formattedData.length,
    data: formattedData,
  };
};

/**
 * Create or re-send an invite
 */
export const createInvite = async (name, email, roleName) => {
  const cleanEmail = email.trim().toLowerCase();

  // 🔹 Step 1: Find role by name
  const role = await RoleModel.findOne({ name: roleName });
  if (!role) {
    throw new Error(`Role '${roleName}' not found`);
  }

  // 🔹 Step 2: Check existing invite
  let invite = await InviteModel.findOne({ email: cleanEmail });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // valid for 24 hours

  if (invite) {
    // Update existing invite
    invite.name = name;
    invite.token = token;
    invite.expiresAt = expiresAt;
    invite.invite += 1;
    invite.role_id = role._id;
    await invite.save();
  } else {
    // Create a new invite
    invite = await InviteModel.create({
      name,
      email: cleanEmail,
      role_id: role._id,
      token,
      expiresAt,
    });
  }

  // 🔹 Step 3: Send invitation email
  const { html, plainText } = templates.generateTeamInviteTemplate(
    invite.token,
    role.name,
    email
  );

  await sendEmail({
    to: email,
    subject: `Invitation to join Onu as ${role.name}`,
    html,
    text: plainText,
  });

  return invite;
};

/**
 * Register a user using an invite token
 */
export const registerUser = async (inviteToken, newRole, userData) => {
  const { name, phone, password, confirmPassword } = userData;

  if (!password || password !== confirmPassword)
    throw ApiError.unauthorized(messages.PASSWORD_INVALID);

  // 🔹 Find assigned role
  const NewRole = await roleRepo.findOne({ name: newRole });
  if (!NewRole) throw ApiError.unauthorized(messages.ROLE_NOT_FOUND);

  // 🔹 Verify invite
  const invite = await inviteRepo.findOne({ token: inviteToken });
  if (!invite) throw ApiError.unauthorized(messages.TOKEN_INVALID);
  if (!invite.expiresAt || invite.expiresAt < new Date())
    throw ApiError.badRequest(messages.TOKEN_EXPIRED);

  // 🔹 Check if user already exists
  const existingUser = await userRepo.findOne({ email: invite.email });
  if (existingUser && invite.accepted)
    throw ApiError.unauthorized(messages.USER_ALREADY_EXISTS);

  // 🔹 Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 🔹 Create user
  const newUser = await userRepo.create({
    name,
    email: invite.email,
    phone,
    password: hashedPassword,
    role_id: NewRole._id,
    status: "active",
  });

  // 🔹 Mark invite as used
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
      role_id: newUser.role_id,
    },
  };
};

// 🔹 Default export
export default {
  getAllInvitedUsers,
  createInvite,
  registerUser,
};
