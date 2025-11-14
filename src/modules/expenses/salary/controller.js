import SalaryService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const SalaryController = {
    createSalary: async (req, res, next) => {
        try {
            const salary = await SalaryService.createSalary(req.body, req.user.id);
            return successResponse(res, salary, "Salary created successfully");
        } catch (err) {
            next(err);
        }
    },

    getAllSalaries: async (req, res, next) => {
        try {
            const salaries = await SalaryService.getAllSalaries(req.user.id);
            return successResponse(res, salaries);
        } catch (err) {
            next(err);
        }
    },

    getSalaryById: async (req, res, next) => {
        try {
            const salary = await SalaryService.getSalaryById(
                req.params.id,
                req.user.id
            );
            return successResponse(res, salary);
        } catch (err) {
            next(err);
        }
    },

    updateSalary: async (req, res, next) => {
        try {
            const salary = await SalaryService.updateSalary(
                req.params.id,
                req.body,
                req.user.id
            );
            return successResponse(res, salary, "Salary updated successfully");
        } catch (err) {
            next(err);
        }
    },

    deleteSalary: async (req, res, next) => {
        try {
            const salary = await SalaryService.deleteSalary(
                req.params.id,
                req.user.id
            );
            return successResponse(res, salary, "Salary deleted successfully");
        } catch (err) {
            next(err);
        }
    },

    approveSalary: async (req, res, next) => {
        try {
            const salary = await SalaryService.updateSalaryStatus(
                req.params.id,
                "approved",
                req.user.id
            );
            return successResponse(res, salary, "Salary approved successfully");
        } catch (err) {
            next(err);
        }
    },

    rejectSalary: async (req, res, next) => {
        try {
            const salary = await SalaryService.updateSalaryStatus(
                req.params.id,
                "rejected",
                req.user.id
            );
            return successResponse(res, salary, "Salary rejected successfully");
        } catch (err) {
            next(err);
        }
    },
};

export default SalaryController;
