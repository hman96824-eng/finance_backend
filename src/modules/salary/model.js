import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
    {
        salaryStartDate: {
            type: Date,
            required: true
        },
        salaryEndDate: {
            type: Date,
            default: null
        },
        salaryIncome: {
            type: Number,
            required: true,
            min: [0, 'Salary cannot be negative']
        },
        lastIncrement: {
            type: Number,
            default: 0
        },
        expectedIncrement: {
            type: Number,
            default: 0
        },
        expectedIncrementDate: {
            type: Date,
            default: null
        },
    },
    { timestamps: true, versionKey: false }
);

export const SalaryModel = mongoose.model("Salary", salarySchema);
