import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema(
    {
        // Main fields matching frontend
        title: { type: String, required: true },        // Expense Name
        description: { type: String },                   // Description
        amount: { type: Number, required: true },       // Amount (PKR)
        category: { type: String, required: true },     // Category
        purchaseBy: { type: String, required: true },   // Purchase By (person name)
        purchaseDate: { type: Date, required: true },   // Purchase date
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" }, // Status

        // 🔗 Connected bank (for bankName in frontend)
        bank: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },

        // 🔗 Uploaded media/attachments (stored as array of Media IDs)
        attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],

        // 🔗 Who created this asset (uploadedBy in frontend comes from this)
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        // 🗑 Soft delete flag
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("Asset", AssetSchema);
