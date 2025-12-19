import * as SummaryService from "./service.js";
import { AccountingPeriodModel } from "../period/model.js";

/**
 * Close the active accounting period and generate a locked summary.
 */
export const closeAccountingPeriod = async (req, res) => {
    try {
        // 1. Fetch active accounting period
        const activePeriod = await AccountingPeriodModel.findOne({ status: "open" });
        if (!activePeriod) {
            return res.status(404).json({ message: "No active month found to close." });
        }

        // 2. Check if summary already exists (idempotency safety)
        const existingSummary = await SummaryService.getLatestClosedSummary();
        if (existingSummary && existingSummary.periodId.toString() === activePeriod._id.toString()) {
            return res.status(400).json({ message: "Summary for the active period already exists." });
        }

        // 3. Generate Summary using Date Ranges
        const summaryData = await SummaryService.generateMonthlySummary(activePeriod);

        // 4. Save Snapshot
        const savedSummary = await SummaryService.createSummary(summaryData);

        // 5. Mark Accounting Period as Closed
        activePeriod.status = "closed";
        activePeriod.updatedAt = new Date(); // Using updatedAt to track closure time
        await activePeriod.save();

        return res.status(200).json({
            message: "Accounting period closed and summary generated successfully.",
            summary: savedSummary,
            period: activePeriod
        });
    } catch (error) {
        console.error("Error closing accounting period:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Summary for this period already exists." });
        }
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

/**
 * Get the latest closed summary.
 */
export const getLastClosedSummary = async (req, res) => {
    try {
        const summary = await SummaryService.getLatestClosedSummary();
        if (!summary) {
            return res.status(404).json({ message: "No closed monthly summaries found." });
        }
        res.status(200).json(summary);
    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSummaryByPeriodId = async (req, res) => {
    try {
        const { periodId } = req.params;
        const summary = await SummaryService.getSummaryByPeriodId(periodId);
        if (!summary) {
            return res.status(404).json({ message: "Summary not found for this period." });
        }
        res.status(200).json(summary);
    } catch (error) {
        console.error("Error fetching summary by periodId:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllSummaries = async (req, res) => {
    try {
        const summaries = await SummaryService.getAllSummaries();
        res.status(200).json(summaries);
    } catch (error) {
        console.error("Error fetching all summaries:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
