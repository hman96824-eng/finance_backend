// import mongoose from "mongoose";

// const DonationExpenseSchema = new mongoose.Schema(
//     {
//         title: { type: String, required: true },
//         description: { type: String },
//         amount: { type: Number, required: true },
//         donatedBy: { type: String, required: true },
//         donationDate: { type: Date, required: true },

//         bankName: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Bank",
//             required: true
//         },

//         enteredBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true
//         },

//         attachments: [
//             { type: mongoose.Schema.Types.ObjectId, ref: "Media" }
//         ],

//         status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
//         isDeleted: { type: Boolean, default: false },
//     },
//     { timestamps: true, versionKey: false }
// );

// const DonationModel = mongoose.model("DonationExpense", DonationExpenseSchema);
// export default DonationModel;

import mongoose from "mongoose";
const DonationExpenseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        amount: { type: Number, required: true },
        donatedBy: { type: String, required: true },
        donationDate: { type: Date, required: true },

        bankName: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },
        enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],

        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        isDeleted: { type: Boolean, default: false },

        accountingPeriod: { type: mongoose.Schema.Types.ObjectId, ref: "AccountingPeriod", required: true }
    },
    { timestamps: true, versionKey: false }
);
const DonationModel = mongoose.model("DonationExpense", DonationExpenseSchema);
export default DonationModel;