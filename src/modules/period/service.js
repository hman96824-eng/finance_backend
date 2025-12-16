import { AccountingPeriodModel } from "./model.js";

// Start a new period
export const startPeriod = async (startDateInput) => {
  const active = await AccountingPeriodModel.findOne({ status: "open" });
  if (active) throw new Error("There is already an active period");

  const startDate = startDateInput ? new Date(startDateInput) : startOfMonth(new Date());
  const endDate = endOfMonth(startDate);

  const period = new AccountingPeriodModel({
    startDate,
    endDate,
    status: "open",
  });

  await period.save();
  return period;
};

// Close period or override end date
export const closePeriod = async (endDateInput) => {
  const active = await AccountingPeriodModel.findOne({ status: "open" });
  if (!active) throw new Error("No active period found");

  const endDate = endDateInput ? new Date(endDateInput) : active.endDate;

  active.endDate = endDate;
  active.status = "closed";
  active.updatedAt = new Date();

  await active.save();
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
