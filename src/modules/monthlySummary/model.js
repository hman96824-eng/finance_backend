import mongoose from "mongoose";

const MonthlySummarySchema = new mongoose.Schema({
    periodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccountingPeriod",
        required: true,
        unique: true
    },
    month: {
        type: String, // e.g., "YYYY-MM" from FinancialMonth.monthKey
        required: true
    },
    totals: {
        billing: { type: Number, default: 0 },
        salary: { type: Number, default: 0 },
        donation: { type: Number, default: 0 },
        general: { type: Number, default: 0 },
        assets: { type: Number, default: 0 },
        business: { type: Number, default: 0 },
        overallTotal: { type: Number, default: 0 }
    },
    breakdown: {
        billing: [{
            title: String,
            amount: Number,
            date: Date,
            paidBy: String
        }],
        salary: [{
            employeeName: String,
            designation: String,
            netSalary: Number
        }],
        donation: [{
            title: String,
            amount: Number,
            date: Date,
            donatedBy: String
        }],
        general: [{
            title: String,
            amount: Number,
            date: Date,
            category: String
        }],
        assets: [{
            title: String,
            amount: Number,
            date: Date,
            purchaseBy: String
        }],
        business: [{
            title: String,
            amount: Number,
            date: Date,
            paidBy: String
        }]
    },
    locked: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const MonthlySummaryModel = mongoose.model("MonthlySummary", MonthlySummarySchema, "monthly_summaries");
