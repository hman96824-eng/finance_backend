import mongoose from "mongoose";

const SalarySchema = new mongoose.Schema(
  {
    salaryStartDate: { type: Date, required: true },
    salaryEndDate: { type: Date, required: true },
    incrementAmount: { type: Number, default: 0 },
    salaryIncome: { type: Number, required: true },
  },
  { _id: false }
);
const DepartmentSchema = new mongoose.Schema(
  {
    departmentName: { type: String, required: true },
    designation: { type: String, required: true },
  },
  { _id: false }
);
const ContractDetailsSchema = new mongoose.Schema(
  {
    contractType: { type: String, required: true },
    contractStartDate: { type: Date, required: true },
    contractEndDate: { type: Date, required: true },
    noticePeriodDays: { type: Number, default: 30 },
  },
  { _id: false }
);
const RelationSchema = new mongoose.Schema(
  {
    name: { type: String },
    relation: { type: String },
    phone: { type: String },
  },
  { _id: false }
);
const PerformanceFeedbackSchema = new mongoose.Schema(
  {
    reviewDate: { type: Date, default: Date.now },
    rating: { type: Number },
    comments: { type: String },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // or "User" depending on your reviewedBy model (adjust if needed)
    },
  },
  { _id: false }
);

const EmployeeSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: "EMPLOYEE" },
    status: { type: String, default: "Active" },
    phone: { type: String, required: true },
    cnic: { type: String, required: true },
    addresses: { type: String },
    gender: { type: String },

    // Avatar now references Media document
    avatar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    // Salary Info
    salary: [SalarySchema],

    // Department Info
    department: DepartmentSchema,

    // Employee Details
    employeeCode: { type: String, required: true, unique: true },
    employeeType: { type: String, required: true },
    startEmployeeDate: { type: Date, required: true },
    endEmployeeDate: { type: Date, required: true },

    // Contract Details
    contractDetails: ContractDetailsSchema,

    // Relations / Emergency Contact (single object as per your chosen schema)
    relations: RelationSchema,

    // Performance Feedback (single object as per your chosen schema)
    performanceFeedback: PerformanceFeedbackSchema,
  },
  { timestamps: true }
);

export const EmployeeModel = mongoose.model("Employee", EmployeeSchema);
