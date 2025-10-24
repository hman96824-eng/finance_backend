import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Ensure default permissions are merged with any custom ones
roleSchema.pre("save", function (next) {
  if (this.isNew) {
    // Combine default and custom permissions (avoid duplicates)
    const allPermissions = [...new Set([...(this.permissions || [])])];
    this.permissions = allPermissions;
  }
  next();
});

export const RoleModel = mongoose.model("Role", roleSchema);
