import Repository from "../../utils/repository.js";
import ApiError from "../../utils/ApiError.js";
import { FeedbackModel } from "./model.js";
import { UserModel } from "../user/model.js";
import messages from "../../constants/messages.js";
import { uploadToCloudinary } from "../../config/cloud.js";
import fs from "fs";

const feedbackRepo = new Repository(FeedbackModel);
const userRepo = new Repository(UserModel);

/**
 * Create new feedback
 */
export const createFeedback = async (feedbackData, userId, filePath = null) => {
  try {
    // Get user with role
    const user = await UserModel.findById(userId)
      .populate("role_id")
      .exec();

    if (!user) {
      throw ApiError.notFound(messages.USER_NOT_FOUND);
    }

    // Get role name ONCE
    const roleName = user.role_id?.name || "User";

    // 🚫 Restrict admin from submitting feedback
    if (roleName.toLowerCase() === "admin") {
      throw ApiError.forbidden("Admin users are not allowed to submit feedback");
    }

    let attachmentUrl = null;
    let attachmentPublicId = null;

    // Handle file upload
    if (filePath) {
      try {
        const uploadResult = await uploadToCloudinary(
          filePath,
          "feedback-attachments",
          { resource_type: "auto" }
        );

        attachmentUrl = uploadResult.secure_url;
        attachmentPublicId = uploadResult.public_id;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (uploadError) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw ApiError.badRequest("Failed to upload attachment");
      }
    } 
    // Handle URL attachment
    else if (feedbackData.file && typeof feedbackData.file === "string") {
      attachmentUrl = feedbackData.file;
    }

    // Create feedback
    const feedback = await feedbackRepo.create({
      firstName: feedbackData.firstName,
      lastName: feedbackData.lastName,
      email: feedbackData.email,
      phone: feedbackData.phone || null,
      message: feedbackData.message,
      attachmentUrl,
      attachmentPublicId,
      sender: userId,
      senderRole: roleName,
      status: "pending",
    });

    return {
      _id: feedback._id,
      firstName: feedback.firstName,
      lastName: feedback.lastName,
      email: feedback.email,
      phone: feedback.phone,
      message: feedback.message,
      attachmentUrl: feedback.attachmentUrl,
      status: feedback.status,
      createdAt: feedback.createdAt,
    };
  } catch (error) {
    throw error;
  }
};


/**
 * Get all feedback (Admin only)
 */
export const getAllFeedback = async (filters = {}) => {
  try {
    const { status, startDate, endDate, senderRole } = filters;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (senderRole) {
      query.senderRole = senderRole;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const feedbacks = await feedbackRepo.findWithPopulate(
      query,
      [
        {
          path: "sender",
          select: "name email role_id",
          populate: {
            path: "role_id",
            select: "name",
          },
        },
      ],
      { createdAt: -1 } // Sort by newest first
    );

    return feedbacks.map((feedback) => ({
      _id: feedback._id,
      firstName: feedback.firstName,
      lastName: feedback.lastName,
      email: feedback.email,
      phone: feedback.phone,
      message: feedback.message,
      attachmentUrl: feedback.attachmentUrl,
      sender: {
        _id: feedback.sender?._id,
        name: feedback.sender?.name,
        email: feedback.sender?.email,
        role: feedback.sender?.role_id?.name,
      },
      senderRole: feedback.senderRole,
      status: feedback.status,
      adminNotes: feedback.adminNotes,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Get feedback by ID (Admin only)
 */
export const getFeedbackById = async (feedbackId) => {
  try {
    const feedback = await feedbackRepo.findByIdWithPopulate(feedbackId, [
      {
        path: "sender",
        select: "name email phone role_id",
        populate: {
          path: "role_id",
          select: "name",
        },
      },
    ]);

    if (!feedback) {
      throw ApiError.notFound("Feedback not found");
    }

    return {
      _id: feedback._id,
      firstName: feedback.firstName,
      lastName: feedback.lastName,
      email: feedback.email,
      phone: feedback.phone,
      message: feedback.message,
      attachmentUrl: feedback.attachmentUrl,
      sender: {
        _id: feedback.sender?._id,
        name: feedback.sender?.name,
        email: feedback.sender?.email,
        phone: feedback.sender?.phone,
        role: feedback.sender?.role_id?.name,
      },
      senderRole: feedback.senderRole,
      status: feedback.status,
      adminNotes: feedback.adminNotes,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update feedback status (Admin only)
 */
export const updateFeedbackStatus = async (
  feedbackId,
  status,
  adminNotes = null
) => {
  try {
    const feedback = await feedbackRepo.findById(feedbackId);
    if (!feedback) {
      throw ApiError.notFound("Feedback not found");
    }

    const updateData = { status };
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    const updatedFeedback = await feedbackRepo.updateById(feedbackId, updateData);

    return {
      _id: updatedFeedback._id,
      status: updatedFeedback.status,
      adminNotes: updatedFeedback.adminNotes,
      updatedAt: updatedFeedback.updatedAt,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's own feedback
 */
export const getUserFeedback = async (userId) => {
  try {
    const feedbacks = await feedbackRepo.find(
      { sender: userId },
      { createdAt: -1 }
    );

    return feedbacks.map((feedback) => ({
      _id: feedback._id,
      firstName: feedback.firstName,
      lastName: feedback.lastName,
      email: feedback.email,
      phone: feedback.phone,
      message: feedback.message,
      attachmentUrl: feedback.attachmentUrl,
      status: feedback.status,
      adminNotes: feedback.adminNotes,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Delete feedback (Admin only)
 */
export const deleteFeedback = async (feedbackId) => {
  try {
    const feedback = await feedbackRepo.findById(feedbackId);
    if (!feedback) {
      throw ApiError.notFound("Feedback not found");
    }

    // Delete from cloudinary if attachment exists
    if (feedback.attachmentPublicId) {
      try {
        const cloudinary = (await import("../../config/cloud.js")).default;
        await cloudinary.uploader.destroy(feedback.attachmentPublicId);
      } catch (cloudError) {
        console.error("Failed to delete cloudinary file:", cloudError);
      }
    }

    await feedbackRepo.delete(feedbackId);

    return { message: "Feedback deleted successfully" };
  } catch (error) {
    throw error;
  }
};

export default {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getUserFeedback,
  deleteFeedback,
};
