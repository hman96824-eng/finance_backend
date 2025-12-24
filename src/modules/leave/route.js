import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import { uploadLeaveAttachment } from "../../middleware/leaveUpload.middleware.js";
import LeaveController from "./controller.js";

const router = express.Router();

// Users can create leave with attachment (uploads to Cloudinary)
router.post("/create", middleware.authenticate, uploadLeaveAttachment, LeaveController.createLeave);

// Admin can only update leave status (not create or delete)
router.put("/update/:leaveId", middleware.authenticate, middleware.checkAdmin, LeaveController.updateLeave);

// Both users and admins can view leaves
router.get("/all", middleware.authenticate, LeaveController.getAllLeaves);
router.get("/my-leave-info", middleware.authenticate, LeaveController.getMyLeaveInfo);
router.get("/:leaveId", middleware.authenticate, LeaveController.getLeaveById);

// Only admins can delete leaves
router.delete("/delete", middleware.authenticate, middleware.checkAdmin, LeaveController.deleteLeave);

export default router;
