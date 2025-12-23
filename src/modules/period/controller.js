import * as AccountingPeriodService from "./service.js";

// POST /admin/period/start
export const startPeriodController = async (req, res, next) => {
  try {
    const { startDate , expectedEndDate } = req.body; // optional
    if (!startDate) {
      throw new Error("startDate is required to start a new period");
    }
    const period = await AccountingPeriodService.startPeriod(startDate, expectedEndDate);
    res.json({ success: true, period });
  } catch (err) {
    next(err);
  }
};

// PATCH /admin/period/close
export const closePeriodController = async (req, res, next) => {
  try {
    const { endDate, notes } = req.body; // optional
    const period = await AccountingPeriodService.closePeriod(endDate, notes);
    res.json({ success: true, period });
  } catch (err) {
    next(err);
  }
};

// GET /api/period/active
export const getActivePeriodController = async (req, res, next) => {
  try {
    const period = await AccountingPeriodService.getActivePeriod();
    res.json({ success: true, period });
  } catch (err) {
    next(err);
  }
};
