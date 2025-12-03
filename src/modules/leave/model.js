
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
  },
  { timestamps: true }
);

export const LeaveModel = mongoose.model("Leave", LeaveSchema);
