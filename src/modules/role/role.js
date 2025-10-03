import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["ADMIN", "MANAGER", "EMPLOYEE"], // allowed roles
      required: true,
      unique: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "manage_users",
          "view_users",
          "assign_roles",
          "manage_system_settings",
          "view_audit_logs",
          "create_transaction",
          "edit_transaction",
          "delete_transaction",
          "view_transactions",
          "approve_transactions",
          "approve_transfers",
          "final_approval",
          "manage_bank_accounts",
          "generate_reports",
          "view_reports",
          "view_own_payslip",
          "view_own_profile",
          "update_own_profile",
          "toggle_status",
        ],
      },
    ],
  },
  { timestamps: true }
);

export const RoleModel = mongoose.model("Role", roleSchema);
