import mongoose from "mongoose";

const BankSchema = new mongoose.Schema(
    {
        bankName: {
            type: String,
            required: true,
            trim: true,
        },
        accountTitle: {
            type: String,
            required: true,
            trim: true,
        },
        accountNumber: {
            type: String,
            required: true,
            trim: true,
        },
        ibanNumber: {
            type: String,
            trim: true,
        },
        budget: {
            type: Number,
            required: true,
        },
        advanceAmount: {
            type: Number,
            required: true,
        },
        pendingAmount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Bank", BankSchema);
