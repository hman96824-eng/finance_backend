import BusinessExpenseService from "./service.js";
import { uploadMedia } from "../../media/service.js";
import { UserModel } from "../../user/model.js";
import { successResponse } from "../../../utils/response.helper.js";

import { AccountingPeriodModel } from "../../period/model.js";

const BusinessExpenseController = {
    createExpense: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // 1. Get Active Accounting Period
            const activePeriod = await AccountingPeriodModel.findOne({ status: "open" });
            if (!activePeriod) {
                return res.status(404).json({ message: "No active month found" });
            }

            let attachmentIds = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "business-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            const user = await UserModel.findById(userId)
                .select("name email");

            const result = await BusinessExpenseService.createExpense({
                ...req.body,
                attachments: attachmentIds,
                enteredBy: userId,
                accountingPeriod: activePeriod._id
            });

            // Get populated response for create
            const populated = await BusinessExpenseService.getExpenseById(result._id);

            return successResponse(res, populated, "Business Expense created");
        } catch (err) {
            next(err);
        }
    },

    updateExpense: async (req, res, next) => {
        try {
            const userId = req.user.id;

            let attachmentIds = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "business-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            const updateData = { ...req.body };
            if (attachmentIds.length > 0) updateData.attachments = attachmentIds;

            const updated = await BusinessExpenseService.updateExpense(req.params.id, updateData);

            return successResponse(res, {
                ...updated,
                bankName: updated.bankName?.bankName || null,
            }, "Business Expense updated successfully");
        } catch (err) {
            next(err);
        }
    },

    softDeleteExpense: async (req, res, next) => {
        try {
            const result = await BusinessExpenseService.softDelete(req.params.id);
            return successResponse(res, result, "Business Expense moved to trash");
        } catch (err) { next(err); }
    },

    softDeleteMany: async (req, res, next) => {
        try {
            const result = await BusinessExpenseService.softDeleteMany(req.body.ids);
            return successResponse(res, result, "Business Expenses moved to trash");
        } catch (err) { next(err); }
    },

    deleteExpense: async (req, res, next) => {
        try {
            const result = await BusinessExpenseService.deleteExpense(req.params.id);
            return successResponse(res, result, "Business Expense deleted permanently");
        } catch (err) { next(err); }
    },

    deleteManyExpense: async (req, res, next) => {
        try {
            const result = await BusinessExpenseService.deleteMany(req.body.ids);
            return successResponse(res, result, "Business Expenses deleted permanently");
        } catch (err) { next(err); }
    },

    getAllExpenses: async (req, res, next) => {
        try {
            if (!req.accountingPeriod) return successResponse(res, { data: [], pagination: {} });

            const { page = 1, limit = 10 } = req.query;
            const data = await BusinessExpenseService.getAllExpenses(req.accountingPeriod, page, limit);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },

    getExpenseById: async (req, res, next) => {
        try {
            const data = await BusinessExpenseService.getExpenseById(req.params.id);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },

    uploadAttachments: async (req, res, next) => {
        try {
            // Validate that files are present
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                    message: "At least one attachment file is required"
                });
            }

            const userId = req.user.id;
            let attachmentIds = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "business-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            // This will merge with existing attachments via the service updateExpense method
            const updated = await BusinessExpenseService.updateExpense(req.params.id, { attachments: attachmentIds });

            return successResponse(res, updated, "Attachments uploaded successfully");
        } catch (err) { next(err); }
    },

    deleteAttachments: async (req, res, next) => {
        try {
            const expenseId = req.params.id;
            const attachmentIds = req.body.ids || req.body.attachmentIds;

            if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
                throw new Error("Please provide valid attachment IDs in 'ids' array");
            }

            const updated = await BusinessExpenseService.deleteAttachments(expenseId, attachmentIds);
            return successResponse(res, updated, "Attachments deleted from business expense successfully");
        } catch (err) { next(err); }
    }
};

export default BusinessExpenseController;
