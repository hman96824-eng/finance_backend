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

const userRepo = new Repository(UserModel)
const inviteRepo = new Repository(InviteModel)
const roleRepo = new Repository(RoleModel)

export const getAllInvitedUsers = async (acceptedFilter) => {
    let filter = {};

    if (acceptedFilter === "true") filter.accepted = true;
    else if (acceptedFilter === "false") filter.accepted = false;

    const invites = await inviteRepo.findAll(filter);

    const totalUsers = await inviteRepo.countAll();
    const totalAccepted = await inviteRepo.countByField({ accepted: true });
    const totalUnaccepted = await inviteRepo.countByField({ accepted: false });

    const formattedData = invites.map((inv) => ({
        email: inv.email,
        role_id: inv.role_id,
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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (invite) {
        invite.name = name; // ✅ Update name if needed
        invite.token = token;
        invite.expiresAt = expiresAt;
        invite.invite += 1;
        invite.role_id = role._id;
        await invite.save();
    } else {
        invite = await InviteModel.create({
            name, // ✅ New field
            email: cleanEmail,
            role_id: role._id,
            token,
            expiresAt,
        });
    }

    // 🔹 Step 3: Send email
    await sendEmail({
        to: email,
        subject: `You’re invited as ${role.name}`,
        html: templates.generateTeamInviteTemplate(invite.token, role.name, email),
    });

    return invite;
};
export const registerUser = async (inviteToken, newRole, userData) => {
    const { name, phone, password, confirmPassword } = userData;
    if (!password || password !== confirmPassword)
        throw ApiError.unauthorized(messages.PASSWORD_INVALID);

    const NewRole = await roleRepo.findOne({ name: newRole })
    if (!NewRole) throw ApiError.unauthorized(messages.ROLE_NOT_FOUND)

    const invite = await inviteRepo.findOne({ token: inviteToken });
    if (!invite) throw ApiError.unauthorized(messages.TOKEN_INVALID);
    if (!invite.expiresAt || invite.expiresAt < new Date())
        throw ApiError.badRequest(messages.TOKEN_EXPIRED);
    // if (invite.accepted && ) throw new Error("Invitation already used.");

    const existingUser = await userRepo.findOne({ email: invite.email });
    if (existingUser && invite.accepted)
        throw ApiError.unauthorized(messages.USER_ALREADY_EXISTS);

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userRepo.create({
        name,
        email: invite.email,
        phone,
        password: hashedPassword,
        role_id: NewRole._id,
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
            role_id: newUser.role_id,
        },
    };
};


export default {
    getAllInvitedUsers,
    createInvite,
    registerUser
}