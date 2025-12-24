/**
 * Migration Script: Add Feedback Permissions to Admin Role
 * 
 * This script adds the required permissions for the feedback module
 * to the Admin role.
 * 
 * Run this script once after implementing the feedback feature:
 * node src/migrations/add-feedback-permissions.js
 */

import { config } from "../config/config.js";
import mongoose from "mongoose";
import { RoleModel } from "../modules/role/model.js";

const addFeedbackPermissions = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(config.MONGO_URI);
    console.log("✅ Connected to database");

    // Permissions to add
    const feedbackPermissions = ["view_feedback", "manage_feedback"];

    console.log("\n🔄 Adding feedback permissions to Admin role...");

    // Find Admin role (try both uppercase and capitalized)
    let adminRole = await RoleModel.findOne({ name: "ADMIN" });
    
    if (!adminRole) {
      adminRole = await RoleModel.findOne({ name: "Admin" });
    }

    if (!adminRole) {
      console.error("❌ Admin role not found!");
      console.log("Please create an ADMIN or Admin role first.");
      process.exit(1);
    }

    console.log(`📋 Current Admin permissions: ${adminRole.permissions.length}`);
    console.log(`   Permissions: ${adminRole.permissions.join(", ")}`);

    // Add new permissions if they don't exist
    let permissionsAdded = 0;
    feedbackPermissions.forEach((permission) => {
      if (!adminRole.permissions.includes(permission)) {
        adminRole.permissions.push(permission);
        permissionsAdded++;
        console.log(`   ✅ Added: ${permission}`);
      } else {
        console.log(`   ℹ️  Already exists: ${permission}`);
      }
    });

    if (permissionsAdded > 0) {
      await adminRole.save();
      console.log(`\n✅ Successfully added ${permissionsAdded} permission(s) to Admin role`);
    } else {
      console.log("\nℹ️  No new permissions to add. Admin role already has feedback permissions.");
    }

    console.log(`\n📋 Updated Admin permissions: ${adminRole.permissions.length}`);
    console.log(`   Permissions: ${adminRole.permissions.join(", ")}`);

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the migration
addFeedbackPermissions();
