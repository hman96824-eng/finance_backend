// import mongoose from "mongoose";
// import { string } from "zod";

// const ProjectSchema = new mongoose.Schema(
//   {
//     projectName: { type: String, required: true, trim: true },
//     projectID: { type: String, required: true, unique: true, trim: true },
//     projectType: { type: String, trim: true },
//     projectDetails: { type: String, trim: true },
//     clientName: { type: String, trim: true },
//     projectManager: { type: String, trim: true },
//     teamMembers: { type: [String], default: [] },
//     startDate: { type: Date },
//     endDate: { type: Date },
//     status: {
//       type: String,
//       enum: ["Pending", "Completed", "Deleted"],
//       default: "Pending",
//     },

//     // Reference to Bank Schema
//     bank: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Bank",
//       required: false,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Project", ProjectSchema);

import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    projectName: { type: String, trim: true },
    projectID: { type: String, required: true, unique: true, trim: true },
    projectType: { type: String, trim: true },
    projectDetails: { type: String, trim: true },
    clientName: { type: String, trim: true },
    projectManager: { type: String, trim: true },
    teamMembers: { type: [String], default: [] },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Deleted"],
      default: "Pending",
    },

    // Financial fields per project
    budget: { type: Number },
    advanceAmount: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },

    // Reference to shared bank
    banks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bank",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Project", ProjectSchema);
