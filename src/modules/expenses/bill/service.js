import BillingModel from "./model.js";
import Bank from "../../bank/model.js";
import Repo from "../../../utils/repository.js";
import ApiError from "../../../utils/ApiError.js";
import { deleteMedia } from "../../media/service.js";

const BillingRepo = new Repo(BillingModel);
const BankRepo = new Repo(Bank);

class BillingExpenseService {
    static createExpense = async (body) => {
        // Expect body.enteredBy to be userId, body.amount numeric, body.bankName = bankId
        const bank = await BankRepo.findById(body.bankName);
        if (!bank) throw ApiError.notFound("Bank not found");

        if (bank.balance < body.amount) throw ApiError.badRequest("Not enough bank balance");

        // Deduct bank balance
        await BankRepo.update(bank._id, { balance: bank.balance - body.amount });

        // Create billing expense
        return await BillingRepo.create(body);
    };
    static updateExpense = async (id, body) => {
        // Merge attachments if present (append new ones)
        if (body.attachments && body.attachments.length > 0) {
            const existing = await BillingModel.findById(id).select("attachments");
            if (existing && existing.attachments) {
                body.attachments = [...existing.attachments.map(a => a.toString()), ...body.attachments];
            }
        }

        const updated = await BillingRepo.updateById(id, body);

        // Return populated document
        return await BillingModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();
    };
    static softDelete = async (id) => {
        return await BillingRepo.updateById(id, { status: "Inactive", isDeleted: true });
    };
    static softDeleteMany = async (ids) => {
        return await BillingModel.updateMany(
            { _id: { $in: ids } },
            { status: "Inactive", isDeleted: true }
        );
    };
    static deleteExpense = async (id) => {
        return await BillingRepo.deleteById(id);
    };
    static deleteMany = async (ids) => {
        return await BillingRepo.deleteMany({ _id: { $in: ids } });
    };
    static getAllExpenses = async () => {
        const expenses = await BillingModel.find({ isDeleted: false })
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .select("-isDeleted")
            .lean();

        // Map to frontend expected shape 
        return expenses.map((exp) => ({
            ...exp,
            bankName: exp.bankName?.bankName || null,
        }));
    };
    static getExpenseById = async (id) => {
        const exp = await BillingModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .select("-isDeleted")
            .lean();

        if (!exp) throw ApiError.notFound("Billing Expense not found");

        return {
            ...exp,
            bankName: exp.bankName?.bankName || null,
        };
    };
    static deleteAttachments = async (id, attachmentIds) => {
        const expense = await BillingModel.findById(id);
        if (!expense) throw ApiError.notFound("Expense not found");

        // Delete each media file from DB / cloud
        for (const attachmentId of attachmentIds) {
            try {
                await deleteMedia(attachmentId);
            } catch (err) {
                console.error(`Failed to delete media ${attachmentId}:`, err.message);
                // continue deleting others
            }
        }

        // Remove the attachment IDs from the expense's attachments array
        expense.attachments = expense.attachments.filter(
            attachment => !attachmentIds.includes(attachment.toString())
        );

        await expense.save();

        return await BillingModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();
    };
}

export default BillingExpenseService;
