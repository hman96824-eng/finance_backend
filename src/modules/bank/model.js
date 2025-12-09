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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Unique constraint
BankSchema.index({ accountNumber: 1, createdBy: 1 }, { unique: true, sparse: true });

// Auto-update balance on save
BankSchema.pre("save", function (next) {
  if (this.isNew) {
    this.balance = Number(this.balance || 0);
  } else {
    const latest = this.paymentHistory[this.paymentHistory.length - 1];
    if (latest) {
      this.balance =
        Number(this.balance || 0) +
        (latest.type === "credit" ? Number(latest.amount || 0) : -Number(latest.amount || 0));
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
