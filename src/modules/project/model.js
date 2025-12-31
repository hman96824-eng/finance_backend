import mongoose from "mongoose";

const BankPaymentSchema = new mongoose.Schema(
  {
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", },
    amount: { type: Number, },
    type: { type: String, enum: ["credit", "debit"], default: "credit" },
    note: { type: String },
    date: { type: Date, default: Date.now },
    // store a snapshot of bank details that might be useful in project views
    bankSnapshot: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountTitle: { type: String }
    }
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    projectName: { type: String, trim: true },
    projectID: { type: String, required: true, unique: true, trim: true },
    projectType: { type: String, trim: true },
    projectDetails: { type: String, trim: true },
    clientName: { type: String, trim: true },
    projectManager: { type: String, trim: true },
    teamMembers: { type: [String], default: [] },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["Pending", "Done", "Deleted"],
      default: "Pending"
    },
    overrideReason: { type: String, trim: true },

    // Financial fields per project
    // user will enter USD
    budgetUSD: { type: Number, default: 0 },

    // auto-calculated PKR
    budgetPKR: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },

    // Reference to many banks (IDs)
    banks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bank"
      }
    ],

    // New: Keep a per-project list of payments that came via banks (quick access)
    bankPayments: [BankPaymentSchema]
  },
  { timestamps: true }
);

ProjectSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);