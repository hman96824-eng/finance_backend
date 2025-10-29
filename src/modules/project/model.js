import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
    {
        projectName: {
            type: String,
            required: true,
            trim: true,
        },
        projectType: {
            type: String,
            required: true,
            trim: true,
        },
        projectDetails: {
            type: String,
            trim: true,
        },
        clientName: {
            type: String,
            trim: true,
        },
        projectManager: {
            type: String,
            trim: true,
        },
        teamMembers: {
            type: [String],
            default: [],
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["Pending", "Completed", "Deleted"],
            default: "Pending",
        },

        // Reference to Bank Schema
        bank: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bank",
            required: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Project", ProjectSchema);
