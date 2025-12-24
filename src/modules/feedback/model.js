import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    attachmentPublicId: {
      type: String,
      default: null,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ sender: 1 });

export const FeedbackModel = mongoose.model("Feedback", feedbackSchema);
