import BillingExpenseService from "./service.js";
import { uploadMedia } from "../../media/service.js";
import { UserModel } from "../../user/model.js";
import { successResponse } from "../../../utils/response.helper.js";
import { AccountingPeriodModel } from "../../period/model.js";

const BillingExpenseController = {
    createExpense: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // 1. Get Active Accounting Period
            const activePeriod = await AccountingPeriodModel.findOne({ status: "open" });
            if (!activePeriod) {
                return res.status(404).json({ message: "No active month found" });
            }

            // upload attachments (if any) and collect media ids
            let attachmentIds = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "billing-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            // find uploader display name (optional)
            const user = await UserModel.findById(userId).select("name email");

            const payload = {
                ...req.body,
                attachments: attachmentIds,
                enteredBy: userId,
                uploadedBy: user?.name || undefined,
                accountingPeriod: activePeriod._id
            };

            const result = await BillingExpenseService.createExpense(payload);

            // return populated
            const populated = await BillingExpenseService.getExpenseById(result._id);

            return successResponse(res, populated, "Billing Expense created");
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
                    const media = await uploadMedia(file.path, "billing-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            const updateData = { ...req.body };
            if (attachmentIds.length > 0) updateData.attachments = attachmentIds;

            const updated = await BillingExpenseService.updateExpense(req.params.id, updateData);

            return successResponse(res, {
                ...updated,
                bankName: updated.bankName?.bankName || null,
                allFiles: updated.attachments || [],
            }, "Billing Expense updated successfully");
        } catch (err) {
            next(err);
        }
    },
    softDeleteExpense: async (req, res, next) => {
        try {
            const result = await BillingExpenseService.softDelete(req.params.id);
            return successResponse(res, result, "Billing Expense moved to trash");
        } catch (err) { next(err); }
    },
    softDeleteMany: async (req, res, next) => {
        try {
            const result = await BillingExpenseService.softDeleteMany(req.body.ids);
            return successResponse(res, result, "Billing Expenses moved to trash");
        } catch (err) { next(err); }
    },
    deleteExpense: async (req, res, next) => {
        try {
            const result = await BillingExpenseService.deleteExpense(req.params.id);
            return successResponse(res, result, "Billing Expense deleted permanently");
        } catch (err) { next(err); }
    },
    deleteManyExpense: async (req, res, next) => {
        try {
            const result = await BillingExpenseService.deleteMany(req.body.ids);
            return successResponse(res, result, "Billing Expenses deleted permanently");
        } catch (err) { next(err); }
    },
    getAllExpenses: async (req, res, next) => {
        try {
            const accountingPeriod = req.accountingPeriod;

            if (!accountingPeriod) {
                return successResponse(res, { data: [], pagination: {} });
            }

            const { page = 1, limit = 10, search } = req.query;
            const data = await BillingExpenseService.getAllExpenses(accountingPeriod, page, limit, search);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },
    getExpenseById: async (req, res, next) => {
        try {
            const data = await BillingExpenseService.getExpenseById(req.params.id);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },
    uploadAttachments: async (req, res, next) => {
        try {
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
                    const media = await uploadMedia(file.path, "billing-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            const updated = await BillingExpenseService.updateExpense(req.params.id, { attachments: attachmentIds });

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

            const updated = await BillingExpenseService.deleteAttachments(expenseId, attachmentIds);
            return successResponse(res, updated, "Attachments deleted from billing expense successfully");
        } catch (err) { next(err); }
    }
};

export default BillingExpenseController;
