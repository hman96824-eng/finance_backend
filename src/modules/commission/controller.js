import CommissionService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const commissionController = {

    // ⭐ Create Commission + Commission Holders
    createCommission: async (req, res, next) => {
        try {
            const createdBy = req.user.id;
            const payload = { ...req.body, createdBy };

            const data = await CommissionService.createCommission(payload);

            return successResponse(res, data, "Commission created successfully");
        } catch (err) {
            next(err);
        }
    },

    // ⭐ Update Commission (e.g., change holders, percentages, PKR amount, etc.)
    updateCommission: async (req, res, next) => {
        try {
            const commissionId = req.params.commissionId;
            const updatedBy = req.user.id;

            const payload = { ...req.body, updatedBy };
            console.log("Commission update payload:", payload);
            const data = await CommissionService.updateCommission(commissionId, payload);


            return successResponse(res, data, "Commission updated successfully");
        } catch (err) {
            next(err);
        }
    },

    // ⭐ Get all commissions
    getAllCommissions: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, search } = req.query;
            const data = await CommissionService.getAllCommissions(page, limit, search);
            return successResponse(res, data);
        } catch (err) {
            next(err);
        }
    },

    // ⭐ Get commission by ID
    getCommissionById: async (req, res, next) => {
        try {
            const commissionId = req.params.commissionId;

            const data = await CommissionService.getCommissionById(commissionId);

            return successResponse(res, data);
        } catch (err) {
            next(err);
        }
    },

    // ⭐ Delete Single or Multiple commissions
    deleteCommission: async (req, res, next) => {
        try {
            const ids = req.body.ids || [req.params.commissionId];

            const data = await CommissionService.deleteCommission(ids);

            return successResponse(res, data, "Commission(s) deleted successfully");
        } catch (err) {
            next(err);
        }
    },





};

export default commissionController;
