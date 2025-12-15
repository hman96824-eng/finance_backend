import mongoose from "mongoose";

const FinancialMonthSchema = new mongoose.Schema({
  monthKey: { type: String, unique: true }, // e.g., "2025-12"
  status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
});

// Use `export default` for ES Module
const FinancialMonth = mongoose.model("FinancialMonth", FinancialMonthSchema);
export default FinancialMonth;
