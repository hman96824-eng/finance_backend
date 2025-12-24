import feedbackService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";
import ApiError from "../../utils/ApiError.js";
import messages from "../../constants/messages.js";

/**
 * Submit new feedback
 * @route POST /api/v1/feedback
 * @access Private (Authenticated users: Employee, HR, Manager)
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, message, file } = req.body;
    const userId = req.user.id;
    const filePath = req.file ? req.file.path : null;

    // Basic validation
    if (!firstName || !lastName || !email || !message) {
      throw ApiError.badRequest("First name, last name, email, and message are required");
    }

    if (firstName.trim().length < 2) {
      throw ApiError.badRequest("First name must be at least 2 characters");
    }

    if (lastName.trim().length < 2) {
      throw ApiError.badRequest("Last name must be at least 2 characters");
    }

    if (message.trim().length < 10) {
      throw ApiError.badRequest("Message must be at least 10 characters");
    }

    const feedbackData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone,
      message: message.trim(),
      file, // Include file URL if provided as string
    };

    const result = await feedbackService.createFeedback(
      feedbackData,
      userId,
      filePath
    );

    return successResponse(
      res,
      result,
      "Feedback submitted successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all feedback
 * @route GET /api/v1/feedback
 * @access Private (Admin only)
 */
export const getAllFeedback = async (req, res, next) => {
  try {
    let { status, startDate, endDate, senderRole } = req.query;

    // Convert "All" or empty strings to undefined so service ignores filter
    if (!status || status.toLowerCase() === "all") {
      status = undefined;
    }
    if (!senderRole || senderRole.toLowerCase() === "all") {
      senderRole = undefined;
    }

    const filters = {};
    if (status) filters.status = status;
    if (senderRole) filters.senderRole = senderRole;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const result = await feedbackService.getAllFeedback(filters);

    return successResponse(res, result, "Feedback retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};


/**
 * Get feedback by ID
 * @route GET /api/v1/feedback/:id
 * @access Private (Admin only)
 */
export const getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await feedbackService.getFeedbackById(id);

    return successResponse(
      res,
      result,
      "Feedback retrieved successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update feedback status
 * @route PUT /api/v1/feedback/:id/status
 * @access Private (Admin only)
 */
export const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Validate that status is provided
    if (!status) {
      throw ApiError.badRequest("Status is required");
    }

    // Validate status value
    const validStatuses = ["pending", "reviewed", "resolved"];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(
        "Status must be one of: pending, reviewed, resolved"
      );
    }

    const result = await feedbackService.updateFeedbackStatus(
      id,
      status,
      adminNotes
    );

    return successResponse(res, result, "Feedback status updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's feedback
 * @route GET /api/v1/feedback/my-feedback
 * @access Private (Authenticated users)
 */
export const getMyFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await feedbackService.getUserFeedback(userId);

    return successResponse(res, result, "Your feedback retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Delete feedback
 * @route DELETE /api/v1/feedback/:id
 * @access Private (Admin only)
 */
export const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await feedbackService.deleteFeedback(id);

    return successResponse(res, result, "Feedback deleted successfully");
  } catch (error) {
    next(error);
  }
};

export default {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getMyFeedback,
  deleteFeedback,
};
