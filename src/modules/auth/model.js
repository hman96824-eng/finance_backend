import mongoose from "mongoose";

export const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        role_id: {
            type: String,
            enum: ["ADMIN", "MANAGER"],
            default: "ADMIN",
            required: true,
        },
        phone: { type: String, trim: true },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        resetCode: { type: String },
        resetCodeExpires: { type: Date },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

const User = mongoose.model("User", userSchema);

export const inviteSchema = new mongoose.Schema({
    email: { type: String, required: true },
    role_id: { type: String, enum: ["ADMIN", "MANAGER"], required: true },
    token: { type: String },
    expiresAt: { type: Date }, // 🔹 New field
    accepted: { type: Boolean, default: false },
    invite: { type: Number, default: 1 }, // count of invitations sent
}, {
    timestamps: true,
});

const Invite = mongoose.model("Invite", inviteSchema);



export default {
    User,
    Invite,
}