import { Router } from "express";
import * as AccountingPeriodController from "./controller.js";
import middleware from "../../middleware/auth.middleware.js"; // admin auth

const router = Router();

// Admin routes
router.post("/start", middleware.authenticate, AccountingPeriodController.startPeriodController);
router.patch("/close", middleware.authenticate, AccountingPeriodController.closePeriodController);

// Anyone can view active period
router.get("/active", middleware.authenticate, AccountingPeriodController.getActivePeriodController);

export default router;
