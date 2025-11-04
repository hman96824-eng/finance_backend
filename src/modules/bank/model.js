// import mongoose from "mongoose";

// const BankSchema = new mongoose.Schema(
//   {
//     bankName: { type: String, required: true, trim: true },
//     accountTitle: { type: String, required: true, trim: true },
//     accountNumber: { type: String, required: true, trim: true },
//     ibanNumber: { type: String, trim: true },
//     budget: { type: Number, required: true },
//     advanceAmount: { type: Number, required: true },
//     pendingAmount: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Bank", BankSchema);

// import mongoose from "mongoose";

// const ProjectPaymentSchema = new mongoose.Schema(
//   {
//     project: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Project",
//       required: true,
//     },
//     amount: { type: Number, required: true },
//     type: { type: String, enum: ["credit", "debit"], default: "credit" },
//     note: { type: String, trim: true },
//     date: { type: Date, default: Date.now },
//   },
//   { _id: false }
// );

// const BankSchema = new mongoose.Schema(
//   {
//     bankName: { type: String, required: true, trim: true },
//     accountTitle: { type: String, required: true, trim: true },
//     accountNumber: { type: String, required: true, trim: true },
//     ibanNumber: { type: String, trim: true },

//     // 💰 Combined total of all project payments under this bank
//     totalBankBalance: { type: Number, default: 0 },

//     // 📜 All payments made from all projects
//     paymentHistory: [ProjectPaymentSchema],
//   },
//   { timestamps: true }
// );

// // 🧮 Auto-calculate bank balance
// BankSchema.pre("save", function (next) {
//   this.totalBankBalance = this.paymentHistory.reduce(
//     (sum, tx) => sum + (tx.type === "credit" ? tx.amount : -tx.amount),
//     0
//   );
//   next();
// });

// export default mongoose.model("Bank", BankSchema);

import mongoose from "mongoose";

const ProjectPaymentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], default: "credit" },
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BankSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true, lowercase: true },
    accountTitle: { type: String, trim: true, lowercase: true },
    accountNumber: { type: String, trim: true },
    ibanNumber: { type: String, trim: true, uppercase: true },

    totalBankBalance: { type: Number, default: 0 },
    paymentHistory: [ProjectPaymentSchema],
  },
  { timestamps: true }
);

// 🧩 Ensure uniqueness for same bank account + IBAN
BankSchema.index({ accountNumber: 1, ibanNumber: 1 }, { unique: true });

// 💰 Auto-calculate bank balance before save
BankSchema.pre("save", function (next) {
  this.totalBankBalance = this.paymentHistory.reduce(
    (sum, tx) => sum + (tx.type === "credit" ? tx.amount : -tx.amount),
    0
  );
  next();
});

export default mongoose.model("Bank", BankSchema);
