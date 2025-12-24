import GeneralExpenseService from "./service.js";
import { uploadMedia } from "../../media/service.js";
import { successResponse } from "../../../utils/response.helper.js";
import { AccountingPeriodModel } from "../../period/model.js";

const GeneralExpenseController = {
    createExpense: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const purchaseBy = req.body.purchaseBy || "";

            // 1. Get Active Accounting Period
            const activePeriod = await AccountingPeriodModel.findOne({ status: "open" });
            if (!activePeriod) {
                return res.status(404).json({ message: "No active month found" });
            }

            let attachmentIds = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "general-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            const payload = {
                ...req.body,
                attachments: attachmentIds,
                createdBy: userId,
                purchaseBy,
                accountingPeriod: activePeriod._id
            };
            const result = await GeneralExpenseService.createExpense(payload);
            const populated = await GeneralExpenseService.getExpenseById(result._id);

            return successResponse(res, populated, "General Expense created successfully");
        } catch (err) { next(err); }
    },
    updateExpense: async (req, res, next) => {
        try {
            const userId = req.user.id;

            let attachmentIds = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "general-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            const updateData = { ...req.body };
            if (attachmentIds.length > 0) updateData.attachments = attachmentIds;

            const updated = await GeneralExpenseService.updateExpense(req.params.id, updateData);

            return successResponse(res, updated, "General Expense updated successfully");
        } catch (err) { next(err); }
    },
    softDeleteExpense: async (req, res, next) => {
        try {
            const result = await GeneralExpenseService.softDelete(req.params.id);
            return successResponse(res, result, "Expense moved to trash");
        } catch (err) { next(err); }
    },
    softDeleteMany: async (req, res, next) => {
        try {
            const result = await GeneralExpenseService.softDeleteMany(req.body.ids);
            return successResponse(res, result, "Expenses moved to trash");
        } catch (err) { next(err); }
    },
    deleteExpense: async (req, res, next) => {
        try {
            const result = await GeneralExpenseService.deleteExpense(req.params.id);
            return successResponse(res, result, "Expense deleted permanently");
        } catch (err) { next(err); }
    },
    deleteManyExpense: async (req, res, next) => {
        try {
            const result = await GeneralExpenseService.deleteMany(req.body.ids);
            return successResponse(res, result, "Expenses deleted permanently");
        } catch (err) { next(err); }
    },
    getAllExpenses: async (req, res, next) => {
        try {
            if (!req.accountingPeriod) return successResponse(res, { data: [], pagination: {} });

            const { page = 1, limit = 10, search } = req.query;
            const data = await GeneralExpenseService.getAllExpenses(req.accountingPeriod, page, limit, search);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },
    getExpenseById: async (req, res, next) => {
        try {
            const data = await GeneralExpenseService.getExpenseById(req.params.id);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },
    uploadAttachments: async (req, res, next) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: "At least one attachment required" });
            }

            const userId = req.user.id;
            const attachmentIds = [];
            for (const file of req.files) {
                const media = await uploadMedia(file.path, "general-expense", userId);
                attachmentIds.push(media._id);
            }

            const updated = await GeneralExpenseService.updateExpense(req.params.id, { attachments: attachmentIds });
            return successResponse(res, updated, "Attachments uploaded successfully");
        } catch (err) { next(err); }
    },
    deleteAttachments: async (req, res, next) => {
        try {
            const attachmentIds = req.body.ids || req.body.attachmentIds;
            if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
                throw new Error("Please provide valid attachment IDs in 'ids' array");
            }

            const updated = await GeneralExpenseService.deleteAttachments(req.params.id, attachmentIds);
            return successResponse(res, updated, "Attachments deleted successfully");
        } catch (err) { next(err); }
    }
};

export default GeneralExpenseController;
