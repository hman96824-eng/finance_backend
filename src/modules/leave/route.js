import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import LeaveController from "./controller.js";

const router = express.Router();



router
  .post("/create", middleware.authenticate,  LeaveController.createLeave)
  .get("/all", middleware.authenticate, LeaveController.getAllLeaves)
  .get("/:leaveId", middleware.authenticate, LeaveController.getLeaveById)
  .put("/update/:leaveId", middleware.authenticate, LeaveController.updateLeave)
  .delete("/delete", middleware.authenticate, LeaveController.deleteLeave);  

export default router;
