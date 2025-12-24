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
                return res.status(404).json({ message: "No active month found" });
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
            const accountingPeriod = req.accountingPeriod;
            if (!accountingPeriod) return successResponse(res, { data: [], pagination: {} });
            const { page = 1, limit = 10, search } = req.query;
            const data = await SalaryService.getAllSalaries(accountingPeriod, page, limit, search);
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
