import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    token: { type: String },
    expiresAt: { type: Date },
    accepted: { type: Boolean, default: false },
    invite: { type: Number, default: 1 },
}, { timestamps: true });

export const InviteModel = mongoose.model("Invite", inviteSchema);
