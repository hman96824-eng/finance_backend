import express from "express";
import * as MonthlySummaryController from "./controller.js";
import middleware from "../../middleware/auth.middleware.js";

const router = express.Router();


router.use(middleware.authenticate);

// POST /api/v1/summary/close-period
router.post("/close-period", MonthlySummaryController.closeAccountingPeriod);

// GET /api/v1/summary/last-closed
router.get("/last-closed", MonthlySummaryController.getLastClosedSummary);

// GET /api/v1/summary (All summaries)
router.get("/", MonthlySummaryController.getAllSummaries);

// GET /api/v1/summary/:periodId
router.get("/:periodId", MonthlySummaryController.getSummaryByPeriodId);

export default router;
