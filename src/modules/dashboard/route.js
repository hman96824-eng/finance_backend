import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import DashboardController from "./controller.js";
import DashboardService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(middleware.authenticate);

//  Dashboard Routes

router.get("/summary", DashboardController.getDashboardSummary);

router.get("/charts", DashboardController.getDashboardCharts);

// router.get("/projects/:projectId", DashboardController.getProjectDashboard);

// router.get("/employees/:employeeId", DashboardController.getEmployeeDashboard);

// router.get("/leaves", DashboardController.getLeaveSummary);

export default router;