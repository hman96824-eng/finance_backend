import { AccountingPeriodModel } from "./model.js";
import { generateMonthlySummary, createSummary } from "../monthlySummary/service.js";
import { MonthlySummaryModel } from "../monthlySummary/model.js";

// Start a new period
export const startPeriod = async (startDateInput, expectedEndDateInput) => {
  const active = await AccountingPeriodModel.findOne({ status: "open" });
  if (active) throw new Error("There is already an active month");

  const startDate = startDateInput ? new Date(startDateInput) : startOfMonth(new Date());

  // 1. Check if the selected date falls INSIDE any existing period
  const overlapping = await AccountingPeriodModel.findOne({
    startDate: { $lte: startDate },
    endDate: { $gte: startDate }
  });

  if (overlapping) {
    throw new Error(`The selected date falls within an existing ${overlapping.status} period (${overlapping.startDate.toLocaleDateString()} - ${overlapping.endDate.toLocaleDateString()}).`);
  }

  // 2. Strict Chronology: Find the latest ending period to prevent any "back-dated" periods
  const lastPeriod = await AccountingPeriodModel.findOne().sort({ endDate: -1 });

  if (lastPeriod) {
    // Compare YYYY-MM-DD strings for strict calendar date comparison
    const newStartStr = startDate.toISOString().split('T')[0];
    const lastEndStr = lastPeriod.endDate.toISOString().split('T')[0];

    if (newStartStr <= lastEndStr) {
      if (newStartStr === lastEndStr) {
        throw new Error("Cannot start a new month on the same day the previous one was closed. Please wait until tomorrow.");
      } else {
        throw new Error(`New months must start after the latest close month, which ended on ${lastPeriod.endDate.toLocaleDateString()}.`);
      }
    }
  }

  const endDate = expectedEndDateInput ? new Date(expectedEndDateInput) : endOfMonth(startDate);
  const expectedEndDate = expectedEndDateInput ? new Date(expectedEndDateInput) : endDate;

  const period = new AccountingPeriodModel({
    startDate,
    endDate,
    expectedEndDate,
    status: "open",
  });

  await period.save();
  return period;
};

// Close period or override end date
export const closePeriod = async (endDateInput, notes = "") => {
  const active = await AccountingPeriodModel.findOne({ status: "open" });
  if (!active) throw new Error("No active period found");

  const endDate = endDateInput ? new Date(endDateInput) : active.endDate;

  // Strict Logical Validation: End date cannot be before start date
  const startStr = active.startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  if (endStr < startStr) {
    throw new Error(`Month end date (${endDate.toLocaleDateString()}) cannot be before the start date (${active.startDate.toLocaleDateString()}).`);
  }

  // Enforce 21-day minimum duration
  const diffInDays = Math.ceil((endDate - active.startDate) / (1000 * 60 * 60 * 24));
  if (diffInDays < 21 ) {
    throw new Error(`A month must be active for at least 21 days before it can be closed. Current duration: ${diffInDays} days.`);
  }

  active.endDate = endDate;
  active.status = "closed";
  active.updatedAt = new Date();

  await active.save();

  // Generate and save the monthly summary
  try {
    const existingSummary = await MonthlySummaryModel.findOne({ periodId: active._id });
    if (!existingSummary) {
      const summaryData = await generateMonthlySummary(active, notes);
      await createSummary(summaryData);
    }
  } catch (error) {
    console.error("Failed to generate monthly summary on close:", error);
  }

  return active;
};

// Get currently active period
export const getActivePeriod = async () => {
  const active = await AccountingPeriodModel.findOne({ status: "open" }).lean();
  if (active) return active;

  // fallback: current month
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(startDate);
  return { startDate, endDate, status: "open" };
};

// Helpers
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
