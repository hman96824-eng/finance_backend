import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
    {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            default: null
        },
        salary: {
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
