import mongoose from "mongoose";

const SalaryDetailSchema = new mongoose.Schema({
    baseSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    salaryMonth: { type: String, required: true }, // Example: "2025-11"
    paymentDate: { type: Date, required: true },
    bankName: { type: String, required: true },
}, { _id: false }); // We don't need _id for each salary item

const SalaryExpenseSchema = new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    salaries: [SalaryDetailSchema], // Array of salary records
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const SalaryExpense = mongoose.model("SalaryExpense", SalaryExpenseSchema);

export default SalaryExpense;
