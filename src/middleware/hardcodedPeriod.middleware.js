import { AccountingPeriodModel } from "../modules/period/model.js";

export const accountingPeriodMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ Get active (open) period
    const activePeriod = await AccountingPeriodModel.findOne({
      status: "open",
    }).lean();

    let startDate, endDate;

    if (activePeriod) {
      startDate = new Date(activePeriod.startDate);

      // If admin overridden end date → use it
      if (activePeriod.endDate) {
        endDate = new Date(activePeriod.endDate);
      } else {
        endDate = endOfMonth(startDate);
      }
    } else {
      // 2️⃣ Fallback → current month
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(startDate);
    }

    // 3️⃣ Attach to request
    req.accountingPeriod = { startDate, endDate, _id: activePeriod?._id };

    next();
  } catch (err) {
    next(err);
  }
};

// Helpers
const startOfMonth = (d) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

const endOfMonth = (d) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
