import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.Mixed }, // Allow both String and Object for backward compatibility
    projectName: { type: String },
    clientName: { type: String },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit", "commission"], default: "credit" },
    note: { type: String },
    date: { type: Date, default: Date.now },
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
    paymentHistory: [PaymentSchema],
  },
  { timestamps: true }
);

// Unique constraint - global uniqueness on account number
BankSchema.index({ accountNumber: 1 }, { unique: true, sparse: true });

// Auto-update balance on save (ONLY when paymentHistory is modified)
BankSchema.pre("save", function (next) {
  if (this.isNew) {
    this.balance = Number(this.balance || 0);
  } else if (this.isModified("paymentHistory")) {
    const ph = this.paymentHistory;
    if (ph.length > 0) {
      // Find entries that were added in this session
      // Since we usually push to the end, we can compare with original if using a session
      // However, a safer way is to always recalculate balance if history changed, 
      // or just trust the service layer which already updates balance explicitly.

      // DECISION: Service layer already handles balance logic explicitly. 
      // We will keep this hook as a fallback but ONLY for new entries.
      // Better: Recalculate from scratch to be 100% safe if history modified.
      let total = 0;
      ph.forEach(p => {
        total += (p.type === "credit" ? Number(p.amount || 0) : -Number(p.amount || 0));
      });
      // Note: This might overwrite manual balance adjustments if we don't have all history.
      // Given the current state, let's just ENSURE we don't double count.

      // If the service layer ALREADY updated the balance, this hook might overwrite it.
      // So we check if balance was NOT already modified.
      if (!this.isModified("balance")) {
        const latest = ph[ph.length - 1];
        this.balance = (Number(this.balance) || 0) + (latest.type === "credit" ? Number(latest.amount) : -Number(latest.amount));
      }
    }
  }
  next();
});

BankSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});


export const PaymentSchemaforpay = new mongoose.Schema(
  {
    // Who is receiving the payment?
    holderType: {
      type: String,
      enum: ["user", "employee", "external"],
      required: true,
    },

    // USER PAYMENT
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // EMPLOYEE PAYMENT
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    // EXTERNAL PERSON PAYMENT
    externalName: {
      type: String,
      default: null,
      trim: true,
    },

    // Bank selected for payment
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      required: true,
    },

    // Payment amount
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

  },
  { timestamps: true }
);


export default mongoose.models.Bank || mongoose.model("Bank", BankSchema);
