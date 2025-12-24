import express from "express";
import feedbackController from "./controller.js";
import middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";
import { validate } from "../../middleware/validation.middleware.js";
import validation from "../../validation/validation.js";
import { uploadSingle } from "../../middleware/upload.middleware.js";

const router = express.Router();

// Submit feedback (Authenticated users: Employee, HR, Manager)
router.post(
  "/",
  middleware.authenticate,
  uploadSingle, // Handles file upload with field name "file" (optional)
  feedbackController.submitFeedback
);

// Get user's own feedback
router.get(
  "/my-feedback",
  middleware.authenticate,
  feedbackController.getMyFeedback
);

// Get all feedback (Admin only)
router.get(
  "/allfeedback",
  middleware.authenticate,
  checkPermission(["view_feedback"]), // Admin permission
  feedbackController.getAllFeedback
);

// Update feedback status (Admin only) - MUST come before /:id route
router.put(
  "/:id/status",
  express.json(), // Ensure JSON body parsing
  middleware.authenticate,
  checkPermission(["manage_feedback"]),
  feedbackController.updateFeedbackStatus
);

// Get feedback by ID (Admin only)
router.get(
  "/:id",
  middleware.authenticate,
  checkPermission(["view_feedback"]),
  feedbackController.getFeedbackById
);

// Delete feedback (Admin only)
router.delete(
  "/:id",
  middleware.authenticate,
  checkPermission(["manage_feedback"]),
  feedbackController.deleteFeedback
);

export default router;
