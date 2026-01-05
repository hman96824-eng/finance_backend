import mongoose from "mongoose";

const OtherTransactionSchema = new mongoose.Schema(
    {
        bankId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bank",
            required: true,
        },
        transactionType: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        description: {
            type: String,
            trim: true,
            required: false,
        },
        transactionDate: {
            type: Date,
            default: Date.now,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

OtherTransactionSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("OtherTransaction", OtherTransactionSchema);
