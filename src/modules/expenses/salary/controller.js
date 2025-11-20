import SalaryService from "./service.js";
import { successResponse } from "../../../utils/response.helper.js";

const SalaryController = {
    createSalary: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const payload = { ...req.body, createdBy: userId };
            const result = await SalaryService.createSalary(payload,);
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
            const data = await SalaryService.getAllSalaries();
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
