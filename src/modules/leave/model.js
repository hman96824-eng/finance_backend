
import mongoose from "mongoose";

const LeaveEntrySchema = new mongoose.Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    totalDays: { type: Number, required: true },
    attachment: { type: mongoose.Schema.Types.Mixed, default: null }, // Accept both String and Object
    note: { type: String, default: null }, // Admin note for status change
    noteBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // Admin who added the note
    noteAt: { type: Date, default: null }, // When the note was added
  },
  { _id: true }
);

const LeaveHistorySchema = new mongoose.Schema(
  {
    month: { type: String, required: true },   // "2025-01"
    totalDaysOff: { type: Number, required: true },
    salaryDeducted: { type: Number, required: true }, // only extra days beyond 2
  },
  { _id: false }
);

const LeaveSchema = new mongoose.Schema(
  {
    // ❌ FIX: removed unique: true
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },

    leaves: [LeaveEntrySchema],

    history: [LeaveHistorySchema],

    // Annual leave tracking (18 per year)
    annualLeaveBalance: { type: Number, default: 18 },
    lastResetYear: { type: Number, default: () => new Date().getFullYear() },
  },
  { timestamps: true }
);

export const LeaveModel = mongoose.model("Leave", LeaveSchema);
