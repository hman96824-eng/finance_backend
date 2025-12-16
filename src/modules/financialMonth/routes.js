import express from "express";
import FinancialMonthController from "./controller.js";

const router = express.Router();

// Open a new month
router.post("/open", FinancialMonthController.openMonth);

// Close the currently open month
router.post("/close", FinancialMonthController.closeMonth);

// Optional: Get all months or specific month
router.get("/", FinancialMonthController.getAllMonths);

export default router;
