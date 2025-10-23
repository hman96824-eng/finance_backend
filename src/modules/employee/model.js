import mongoose from "mongoose";


// 🔹 Subschema: Contract Details
// --------------------------------------------------
const contractDetailsSchema = new mongoose.Schema(
    {
        contractType: {
            type: String,
            enum: ["permanent", "temporary", "internship", "contract"],
            default: "contract",
        },
        contractStartDate: { type: Date, required: true },
        contractEndDate: { type: Date, default: null },
        noticePeriodDays: { type: Number, default: 30 },
        workHoursPerWeek: { type: Number, default: 40 },
    },
    { _id: false }
);
const relationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        relation: { type: String, trim: true },
        phone: { type: String, trim: true },
    },
    { _id: false }
);
const performanceFeedbackSchema = new mongoose.Schema(
    {
        reviewDate: { type: Date, default: Date.now },
        rating: { type: Number, min: 1, max: 5 },
        comments: { type: String, trim: true },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { _id: false }
);
const employeeSchema = new mongoose.Schema(
    {
        employeeCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        employeeType: { type: String, enum: ["Full-time", "Part-time", "Remote"], default: "Full-time" },

        startEmployeeDate: { type: Date, required: true },
        endEmployeeDate: { type: Date, default: null },
        isActive: { type: Boolean, default: true },

        // Nested sections
        contractDetails: { type: contractDetailsSchema },
        relations: [relationSchema],
        performanceFeedback: [performanceFeedbackSchema],
    },
    { timestamps: true, versionKey: false }
);

export const EmployeeModel = mongoose.model("Employee", employeeSchema);
