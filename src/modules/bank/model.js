import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], default: "credit" },
    note: { type: String },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const BankSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true, required: true },
    accountTitle: { type: String, trim: true, required: true },
    accountNumber: { type: String, trim: true, required: true },
    branchCode: { type: String, trim: true },
    ibanNumber: { type: String, trim: true },
    accountType: { type: String, enum: ["Current", "Saving"], default: "Current" },
    currency: { type: String, default: "PKR" },
    openingDate: { type: Date },
    balance: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Closed"], default: "Active" },

    // Aggregate balance from transactions
    totalBankBalance: { type: Number, default: 0 },

    // All payment history (subdocuments)
    paymentHistory: [PaymentSchema],

    // Ownership tracking
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// --- Indexing (no duplicate accounts per user) ---
BankSchema.index({ accountNumber: 1, createdBy: 1 }, { unique: true, sparse: true });

// --- Balance auto-update on save (recalculate from paymentHistory) ---
BankSchema.pre("save", function (next) {
  this.totalBankBalance = this.paymentHistory.reduce(
    (sum, tx) => sum + (tx.type === "credit" ? Number(tx.amount || 0) : -Number(tx.amount || 0)),
    0
  );
  next();
});

// When converting to JSON, hide __v and return id
BankSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Bank || mongoose.model("Bank", BankSchema);