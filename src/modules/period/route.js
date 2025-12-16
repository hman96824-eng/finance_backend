import { Router } from "express";
import * as AccountingPeriodController from "./controller.js";
// import middleware from "../middleware/authenticate.js"; // admin auth

const router = Router();

// Admin routes
router.post("/start", AccountingPeriodController.startPeriodController);
router.patch("/close", AccountingPeriodController.closePeriodController);

// Anyone can view active period
router.get("/active", AccountingPeriodController.getActivePeriodController);

export default router;
