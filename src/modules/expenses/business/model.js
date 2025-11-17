import mongoose from "mongoose";

const BusinessExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },          // Expense Name
    description: { type: String },                    // Description
    amount: { type: Number, required: true },        // Amount (PKR)
    paidBy: { type: String, required: true },     // Paid By (Cash, Bank, etc.)
    purchaseDate: { type: Date, required: true }, // Purchase Date

    // Bank reference (for bankName in frontend)
    bankName: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },

    // Who entered this expense
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Attachments
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],

    // Status and soft delete
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);


const BussinessModel = mongoose.model("BusinessExpense", BusinessExpenseSchema);

export default BussinessModel;