/**
 * Migration Script: Convert Banks from User-Specific to Global
 * 
 * This script removes the `createdBy` field from all bank documents
 * and updates the unique index to enforce global uniqueness on accountNumber.
 * 
 * IMPORTANT: 
 * - This operation is IRREVERSIBLE without a database backup
 * - Ensure you have a backup before running this script
 * - Test in a development environment first
 * 
 * Usage:
 *   node src/migrations/migrate-banks-to-global.js [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview changes without applying them
 * 
 * Rollback:
 *   If you need to rollback, restore from your database backup.
 *   There is no automated rollback for this migration.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const isDryRun = process.argv.includes("--dry-run");

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Main migration function
const migrateBanks = async () => {
    try {
        console.log("\n🔄 Starting Bank Migration to Global System...\n");

        if (isDryRun) {
            console.log("🔍 DRY RUN MODE - No changes will be made\n");
        }

        const db = mongoose.connection.db;
        const banksCollection = db.collection("banks");

        // Step 1: Count existing banks
        const totalBanks = await banksCollection.countDocuments();
        console.log(`📊 Total banks in database: ${totalBanks}`);

        // Step 2: Count banks with createdBy field
        const banksWithCreatedBy = await banksCollection.countDocuments({
            createdBy: { $exists: true }
        });
        console.log(`📊 Banks with createdBy field: ${banksWithCreatedBy}`);

        if (banksWithCreatedBy === 0) {
            console.log("\n✅ No banks found with createdBy field. Migration not needed.");
            return;
        }

        // Step 3: Preview sample documents (dry run)
        if (isDryRun) {
            console.log("\n📋 Sample documents that will be updated:");
            const samples = await banksCollection
                .find({ createdBy: { $exists: true } })
                .limit(3)
                .toArray();

            samples.forEach((bank, index) => {
                console.log(`\n  Sample ${index + 1}:`);
                console.log(`    Bank Name: ${bank.bankName}`);
                console.log(`    Account Number: ${bank.accountNumber}`);
                console.log(`    Created By: ${bank.createdBy}`);
            });

            console.log("\n⚠️  DRY RUN COMPLETE - No changes were made");
            console.log("   Run without --dry-run to apply changes\n");
            return;
        }

        // Step 4: Remove createdBy field from all banks
        console.log("\n🔧 Removing createdBy field from all bank documents...");
        const updateResult = await banksCollection.updateMany(
            { createdBy: { $exists: true } },
            { $unset: { createdBy: "" } }
        );
        console.log(`✅ Updated ${updateResult.modifiedCount} documents`);

        // Step 5: Drop old compound index if it exists
        console.log("\n🔧 Updating indexes...");
        try {
            const indexes = await banksCollection.indexes();
            const oldIndexExists = indexes.some(
                idx => idx.name === "accountNumber_1_createdBy_1"
            );

            if (oldIndexExists) {
                await banksCollection.dropIndex("accountNumber_1_createdBy_1");
                console.log("✅ Dropped old compound index (accountNumber_1_createdBy_1)");
            } else {
                console.log("ℹ️  Old compound index not found (may have been already removed)");
            }
        } catch (error) {
            console.log("⚠️  Could not drop old index:", error.message);
        }

        // Step 6: Create new unique index on accountNumber only
        try {
            await banksCollection.createIndex(
                { accountNumber: 1 },
                { unique: true, sparse: true }
            );
            console.log("✅ Created new unique index on accountNumber");
        } catch (error) {
            if (error.code === 85) {
                console.log("ℹ️  Index already exists");
            } else {
                console.log("⚠️  Could not create new index:", error.message);
            }
        }

        // Step 7: Verify migration
        console.log("\n🔍 Verifying migration...");
        const remainingWithCreatedBy = await banksCollection.countDocuments({
            createdBy: { $exists: true }
        });

        if (remainingWithCreatedBy === 0) {
            console.log("✅ Verification passed: All createdBy fields removed");
        } else {
            console.log(`⚠️  Warning: ${remainingWithCreatedBy} documents still have createdBy field`);
        }

        // Step 8: Summary
        console.log("\n" + "=".repeat(60));
        console.log("📊 MIGRATION SUMMARY");
        console.log("=".repeat(60));
        console.log(`Total banks:                ${totalBanks}`);
        console.log(`Documents updated:          ${updateResult.modifiedCount}`);
        console.log(`Remaining with createdBy:   ${remainingWithCreatedBy}`);
        console.log("=".repeat(60));
        console.log("\n✅ Migration completed successfully!\n");

    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        throw error;
    }
};

// Run migration
const run = async () => {
    try {
        await connectDB();
        await migrateBanks();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed");
        process.exit(0);
    }
};

run();
