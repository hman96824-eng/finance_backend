import models from './model.js';
import bcrypt from 'bcrypt';
import crypto from "crypto";
import { generateToken, verifyToken, transporter, templates } from '../../utils/index.js';
import tokenUtils from '../../utils/token.js';
import Messages from '../../constants/messages.js';


// ---------------- AUTHENTICATE USER ----------------
export const authlogin = async (email, password) => {
    const user = await models.User.findOne({ email });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    return user; // Return user object if authenticated

};
// ---------------- USERS ----------------
export const getAllUsers = async () => {
    return await models.User.find();
};
// ---------------- USER BY ID ----------------
export const getUserById = async (id) => {
    return await models.User.findById(id);
};
// ---------------- INVITATIONS ----------------
export const createInvite = async (email, role_id) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await models.User.findOne({ email: cleanEmail });
    if (existingUser) {
        throw new Error("User already registered with this email.");
    }

    // Check if invite exists already
    let invite = await models.Invite.findOne({ email: cleanEmail });

    const token = crypto.randomBytes(32).toString("hex"); // always generate fresh token
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h expiry

    if (invite) {
        // Update existing invite
        invite.token = token;
        invite.expiresAt = expiresAt;
        invite.invite = invite.invite + 1;
        await invite.save();
    } else {
        // Create new invite
        invite = await models.Invite.create({
            email: cleanEmail,
            role_id,
            token,
            expiresAt,
            invite: 1,
        });
    }

    // 🔹 Send email with invite link
    const inviteLink = `${process.env.FRONTEND_URL}/auth/register?token=${token}`;
    await transporter.sendMail({
        from: `"Onu Team" <${process.env.SMTP_USER}>`,
        to: cleanEmail,
        subject: "📩 You’re Invited to Join Onu",
        html: templates.generateTeamInviteTemplate(invite.token, role_id),
    });

    return invite;
};
// ---------------- VERIFY TOKEN ----------------
export const verifyInviteToken = async (token) => {
    try {
        // 1. Find invite by token
        const invite = await models.Invite.findOne({ token });

        if (!invite) {
            throw new Error("Invite not found or invalid token");
        }

        // 2. Check if already accepted
        if (invite.accepted) {
            throw new Error("Invitation already accepted");
        }

        // 3. Check expiry (expiresAt from schema)
        if (!invite.expiresAt || new Date() > invite.expiresAt) {
            throw new Error("Invitation token expired");
        }

        return invite; // returns the invite document
    } catch (err) {
        throw new Error(err.message || "Invalid token");
    }
};
// ---------------- REGISTRATION ----------------
export const registerUser = async (inviteToken, userData) => {
    const { name, phone, password, confirmPassword } = userData;

    if (!password || password !== confirmPassword) {
        throw new Error(Messages.PASSWORD_INVALID);
    }

    // 1️⃣ Find invite by token
    const invite = await models.Invite.findOne({ token: inviteToken });
    if (!invite) throw new Error(Messages.TOKEN_INVALID);

    // 2️⃣ Check expiry
    if (!invite.expiresAt || invite.expiresAt < new Date()) {
        throw new Error("Invitation expired. Please request a new invite.");
    }

    // 3️⃣ Check if already accepted
    if (invite.accepted) {
        throw new Error("Invitation already used.");
    }

    // 4️⃣ Check if user already exists
    const existingUser = await models.User.findOne({ email: invite.email });
    if (existingUser) throw new Error(Messages.USER_ALREADY_EXISTS);

    // 5️⃣ Hash password & create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new models.User({
        name,
        email: invite.email,
        phone,
        password: hashedPassword,
        role_id: invite.role_id,
        status: "active",
    });

    await newUser.save();

    // 6️⃣ Mark invite accepted
    invite.accepted = true;
    invite.token = null;
    invite.expiresAt = null;
    await invite.save();

    // 7️⃣ Generate auth token
    const authToken = generateToken(
        { id: newUser._id, email: newUser.email, role: newUser.role_id },
        process.env.JWT_EXPIRES_IN || "7d"
    );

    return {
        message: Messages.SIGNUP_SUCCESS,
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role_id: newUser.role_id,
        },
        token: authToken,
    };
};
// ---------------- TOGGLE STATUS ----------------
export const toggleUserStatus = async (id) => {
    const user = await models.User.findById(id);
    if (!user) throw new Error(Messages.USER_NOT_FOUND);

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    return {
        message: Messages.USER_STATUS_UPDATED,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            status: user.status,
        },
    };
};

export default {
    authlogin,
    getAllUsers,
    getUserById,
    createInvite,
    verifyInviteToken,
    registerUser,
    toggleUserStatus
}