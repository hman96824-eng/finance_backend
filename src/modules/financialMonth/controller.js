import FinancialMonthService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const FinancialMonthController = {

  openMonth: async (req, res, next) => {
    try {
      const { monthKey } = req.body;
      const month = await FinancialMonthService.openMonth(monthKey);
      return successResponse(res, month, "Financial month opened successfully");
    } catch (err) {
      next(err);
    }
  },

  closeMonth: async (req, res, next) => {
    try {
      const month = await FinancialMonthService.closeMonth();
      return successResponse(res, month, "Financial month closed successfully");
    } catch (err) {
      next(err);
    }
  },

  getAllMonths: async (req, res, next) => {
    try {
      const months = await FinancialMonthService.getAllMonths();
      return successResponse(res, months);
    } catch (err) {
      next(err);
    }
  },
};

export default FinancialMonthController;
