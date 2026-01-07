import mongoose from "mongoose";

const ExpenseCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        type: {
            type: String,
            enum: ["general", "asset", "bill", "business", "donation"],
            default: "general",
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

ExpenseCategorySchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const ExpenseCategory = mongoose.models.ExpenseCategory || mongoose.model("ExpenseCategory", ExpenseCategorySchema);

export default ExpenseCategory;
