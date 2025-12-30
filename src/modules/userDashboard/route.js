import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import UserDashboardController from "./controller.js";

const router = express.Router();

// User can get their own dashboard data
router.get("/", middleware.authenticate, UserDashboardController.getUserDashboard);

export default router;
