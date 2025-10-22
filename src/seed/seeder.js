import mongoose from "mongoose";
import dotenv from "dotenv";
import { RoleModel } from "../modules/role/role.js";
import { config } from "../config/config.js";

dotenv.config();

const seedRoles = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);

    const roles = [
      {
        name: "ADMIN",
        permissions: [
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
      {
        name: "MANAGER",
        permissions: [
          // "view_users",
          "create_transaction",
          "edit_transaction",
          "delete_transaction",
          "view_transactions",
          "approve_transactions",
          "approve_transfers",
          "manage_bank_accounts",
          "generate_reports",
          "view_reports",
          "view_own_payslip",
          "view_own_profile",
          "update_own_profile",
        ],
      },
      {
        name: "Employee",
        permissions: [
          "view_own_payslip",
          "view_own_profile",
          "update_own_profile",
        ],
      },
    ];

    for (const role of roles) {
      const exists = await RoleModel.findOne({ name: role.name });
      if (!exists) {
        await RoleModel.create(role);
        console.log(`✅ Role ${role.name} created`);
      } else {
        console.log(`ℹ️ Role ${role.name} already exists`);
      }
    }

    await mongoose.disconnect();
    console.log("🌱 Roles seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
  }
};

seedRoles();
