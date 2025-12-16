import FinancialMonth from "./model.js";
import ApiError from "../../utils/ApiError.js";

class FinancialMonthService {

  // Open a new month
  static async openMonth(monthKey) {
    if (!monthKey) throw ApiError.badRequest("monthKey is required");

    // Close any currently open months
    await FinancialMonth.updateMany(
      { status: "OPEN" },
      { status: "CLOSED", closedAt: new Date() }
    );

    // Create new month
    const month = await FinancialMonth.create({ monthKey, status: "OPEN", openedAt: new Date() });
    return month;
  }

  // Close the currently open month
  static async closeMonth() {
    const openMonth = await FinancialMonth.findOne({ status: "OPEN" });
    if (!openMonth) throw ApiError.notFound("No open month to close");

    openMonth.status = "CLOSED";
    openMonth.closedAt = new Date();
    await openMonth.save();

    return openMonth;
  }

  // Get all months
  static async getAllMonths() {
    return await FinancialMonth.find().sort({ openedAt: -1 });
  }

  // Get currently open month
  static async getCurrentMonth() {
    const openMonth = await FinancialMonth.findOne({ status: "OPEN" });
    if (!openMonth) throw ApiError.notFound("No open month");
    return openMonth;
  }

}

export default FinancialMonthService;
