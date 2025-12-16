import * as AccountingPeriodService from "./service.js";

// POST /admin/period/start
export const startPeriodController = async (req, res, next) => {
  try {
    const { startDate } = req.body; // optional
    const period = await AccountingPeriodService.startPeriod(startDate);
    res.json({ success: true, period });
  } catch (err) {
    next(err);
  }
};

// PATCH /admin/period/close
export const closePeriodController = async (req, res, next) => {
  try {
    const { endDate } = req.body; // optional
    const period = await AccountingPeriodService.closePeriod(endDate);
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
