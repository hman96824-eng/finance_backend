import mongoose from "mongoose";

const GeneralExpenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: [
            "office",
            "utility",
            "travel",
            "food",
            "maintenance",
            "misc"
        ],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        default: Date.now
    },
    bankName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bank",
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    attachments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Media" }
    ],
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const GeneralExpense = mongoose.model("GeneralExpense", GeneralExpenseSchema);

export default GeneralExpense;