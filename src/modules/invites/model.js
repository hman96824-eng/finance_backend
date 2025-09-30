import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
    email: { type: String, required: true },
    role_id: { type: String, enum: ["ADMIN", "MANAGER"], required: true },
    token: { type: String },
    expiresAt: { type: Date }, // 🔹 New field
    accepted: { type: Boolean, default: false },
    invite: { type: Number, default: 1 }, // count of invitations sent
}, {
    timestamps: true,
});

export const InviteModel = mongoose.model("Invite", inviteSchema);