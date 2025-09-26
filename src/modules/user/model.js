import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
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
export default User;
