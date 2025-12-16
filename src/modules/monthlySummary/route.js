import express from "express";
import * as MonthlySummaryController from "./controller.js";

const router = express.Router();

// POST /api/v1/summary/close-period
router.post("/close-period", MonthlySummaryController.closeAccountingPeriod);

// GET /api/v1/summary/last-closed
router.get("/last-closed", MonthlySummaryController.getLastClosedSummary);

export default router;
