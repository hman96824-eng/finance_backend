import mongoose from "mongoose";
import { required } from "zod/mini";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      require: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"], // allowed values
      default: "inactive", // default value
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },
    cnic: { type: String, trim: true },

    // Optional Fields

    bio: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },

    gender: {
      type: String,
      enum: ["", "Male", "Female", "Other"],
      default: null,
    },

    nationality: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },

    avatar: {
      url: { type: String },
      public_id: { type: String },
      default_letter: { type: String }, // store first letter of name
    },

    maritalStatus: {
      type: String,
      enum: ["", "Single", "Married"],
      default: null,
    },
    salary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salary",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    // 🔹 Employee reference (for employees only)
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    // For password reset (optional)
    resetCode: { type: String, default: null },
    resetCodeExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", userSchema);
