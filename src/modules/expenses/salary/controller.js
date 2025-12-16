import SalaryService from "./service.js";
import { successResponse } from "../../../utils/response.helper.js";
import { AccountingPeriodModel } from "../../period/model.js";

const SalaryController = {
    createSalary: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // 1. Get Active Accounting Period
            const activePeriod = await AccountingPeriodModel.findOne({ status: "open" });
            if (!activePeriod) {
                return res.status(404).json({ message: "No active accounting period found" });
            }

            // 2. Attach accountingPeriod to payload
            const payload = {
                ...req.body,
                createdBy: userId,
                accountingPeriod: activePeriod._id
            };

            const result = await SalaryService.createSalary(payload);
            return successResponse(res, result, "Salary added successfully");
        } catch (err) {
            next(err);
        }
    },

    deleteSalary: async (req, res, next) => {
        try {
            const result = await SalaryService.deleteSalary(req.params.id);
            return successResponse(res, result, "Salary deleted permanently");
        } catch (err) { next(err); }
    },

    deleteManySalary: async (req, res, next) => {
        try {
            const result = await SalaryService.deleteMany(req.body.ids);
            return successResponse(res, result, "Salaries deleted permanently");
        } catch (err) { next(err); }
    },

    getAllSalaries: async (req, res, next) => {
        try {
            // Fetch Active Period ID to filter salaries
            // If user explicitly asks for 'history' (via query param?) we could skip this.
            // But based on request, assume default view is for current period.
            // Use accountingPeriod from middleware
            const accountingPeriod = req.accountingPeriod;

            const data = await SalaryService.getAllSalaries(accountingPeriod);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },

    getSalaryById: async (req, res, next) => {
        try {
            const data = await SalaryService.getSalaryById(req.params.id);
            return successResponse(res, data);
        } catch (err) { next(err); }
    }
};

export default SalaryController;
