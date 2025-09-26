import models from './model.js';
import bcrypt from 'bcrypt';
import { generateToken, verifyToken, transporter } from '../../utils/index.js';
import tokenUtils from '../../utils/token.js';
import Messages from '../../constants/messages.js';

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
    // Check if user already exists
    const existingUser = await models.User.findOne({ email });
    if (existingUser) {
        throw new Error(Messages.USER_ALREADY_EXISTS);
    }

    // Check if invite already exists
    const existingInvite = await models.Invite.findOne({ email });
    if (existingInvite) {
        throw new Error(Messages.INVITE_FAILED);
    }

    // Generate invite JWT
    const token = generateToken({ email, role_id }, '1d');

    // Save invite in DB
    const invite = await models.Invite.create({
        email,
        role_id,
        accepted: false
    });

    // Send email
    const link = `${process.env.CLIENT_URL}/register?token=${token}`;
    await transporter.sendMail({
        to: email,
        subject: 'You are invited!',
        html: `<p>You are invited as <b>${role_id}</b>. <a href="${link}">Click here to accept</a></p>`,
    });

    return {
        message: Messages.INVITE_SENT,
        token,
        invite
    };
};
// ---------------- VERIFY TOKEN ----------------
export const verifyInviteToken = (token) => {
    return verifyToken(token);
};
// ---------------- REGISTRATION ----------------
export const registerUser = async (token, userData) => {
    // Verify token from query/header
    const decoded = tokenUtils.verifyToken(token);

    const { name, phone, password, confirmPassword } = userData;
    if (!password || password !== confirmPassword) {
        throw new Error(Messages.PASSWORD_INVALID);
    }

    // Check if user already exists
    const existingUser = await models.User.findOne({ email: decoded.email });
    if (existingUser) {
        throw new Error(Messages.USER_ALREADY_EXISTS);
    }

    // Check invite
    const invite = await models.Invite.findOne({ email: decoded.email });
    if (!invite) {
        throw new Error(Messages.INVITE_FAILED);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new models.User({
        name,
        email: decoded.email,
        phone,
        password: hashedPassword,
        role_id: decoded.role_id,
        status: 'active',
    });

    await newUser.save();

    // ✅ Update invite to accepted
    invite.accepted = true;
    await invite.save();

    // Auth token
    const authToken = generateToken(
        { id: newUser._id, email: newUser.email, role: newUser.role_id },
        process.env.JWT_EXPIRES_IN || '7d'
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
    getAllUsers,
    getUserById,
    createInvite,
    verifyInviteToken,
    registerUser,
    toggleUserStatus
}