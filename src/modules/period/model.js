import mongoose from "mongoose";

const AccountingPeriodSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }, // default  end of month or overridden by admin
  status: { type: String, enum: ["open", "closed"], default: "open" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure only one open period at a time (optional index)
AccountingPeriodSchema.index({ status: 1 }, { unique: true, partialFilterExpression: { status: "open" } });

export const AccountingPeriodModel = mongoose.model("AccountingPeriod", AccountingPeriodSchema);
