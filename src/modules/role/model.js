import mongoose from "mongoose";

const DEFAULT_PERMISSIONS = [
  "view_profile",
  "edit_profile",
  "change_password",
  "logout",
];

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    permissions: {
      type: [String],
      default: DEFAULT_PERMISSIONS,
    },
  },
  { timestamps: true }
);



// Ensure default permissions are merged with any custom ones
roleSchema.pre("save", function (next) {
  if (this.isNew) {
    // Combine default and custom permissions (avoid duplicates)
    const allPermissions = [
      ...new Set([...(this.permissions || []), ...DEFAULT_PERMISSIONS]),
    ];
    this.permissions = allPermissions;
  }
  next();
});

export const RoleModel = mongoose.model("Role", roleSchema);
