import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        designation: { type: String, trim: true }, // e.g. "Software Engineer"
        description: { type: String, trim: true, default: null },
        location: { type: String, trim: true, default: null },
        head: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // optional reference to the department head
            default: null,
        },
    },
    { timestamps: true, versionKey: false }
);

export const DepartmentModel = mongoose.model("Department", departmentSchema);
