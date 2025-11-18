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

        // Create billing expense first
        const createdExpense = await BillingRepo.create(body);

        // Add to bank's expenseHistory
        bank.expenseHistory.push({
            title: body.billName || body.title || "Billing Expense",
            date: body.billDate || new Date(),
            type: "debit",
            amount: body.amount,
            expenseId: createdExpense._id,
            purchaseBy: body.purchaseBy,
            expenseType: "billing"
        });

        // Deduct bank balance and update expense history
        await BankRepo.update(bank._id, {
            balance: bank.balance - body.amount,
            expenseHistory: bank.expenseHistory
        });

        return createdExpense;
    };
    static updateExpense = async (id, body) => {
        // Get existing expense to track changes
        const existingExpense = await BillingModel.findById(id);
        if (!existingExpense) throw ApiError.notFound("Billing Expense not found");

        // Merge attachments if present (append new ones)
        if (body.attachments && body.attachments.length > 0) {
            if (existingExpense.attachments) {
                body.attachments = [...existingExpense.attachments.map(a => a.toString()), ...body.attachments];
            }
        }

        const updated = await BillingRepo.updateById(id, body);

        // Update bank's expenseHistory if amount or title changed
        if (existingExpense.bankName && (body.amount !== undefined || body.billName !== undefined)) {
            const bank = await BankRepo.findById(existingExpense.bankName);
            if (bank) {
                // Check if this expense already exists in expenseHistory
                const existingHistoryIndex = bank.expenseHistory.findIndex(
                    (item) => item.expenseId && item.expenseId.toString() === id
                );

                if (existingHistoryIndex !== -1) {
                    // Update existing history entry
                    bank.expenseHistory[existingHistoryIndex] = {
                        ...bank.expenseHistory[existingHistoryIndex],
                        title: body.billName || existingExpense.billName || body.title || existingExpense.title,
                        amount: body.amount !== undefined ? body.amount : existingExpense.amount,
                        date: body.billDate || existingExpense.billDate,
                    };
                } else {
                    // Add new history entry if it doesn't exist
                    bank.expenseHistory.push({
                        title: body.billName || existingExpense.billName || body.title || existingExpense.title,
                        date: body.billDate || existingExpense.billDate,
                        type: "debit",
                        amount: body.amount !== undefined ? body.amount : existingExpense.amount,
                        expenseId: id,
                        purchaseBy: body.purchaseBy || existingExpense.purchaseBy,
                        expenseType: "billing"
                    });
                }

                await BankRepo.update(bank._id, { expenseHistory: bank.expenseHistory });
            }
        }

        // Return populated document
        const result = await BillingModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();

        return {
            ...result,
            bankName: result.bankName?.bankName || null,
            billDate: result.billDate ? new Date(result.billDate).toISOString().split('T')[0] : null,
        };
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
            billDate: exp.billDate ? new Date(exp.billDate).toISOString().split('T')[0] : null,
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
            billDate: exp.billDate ? new Date(exp.billDate).toISOString().split('T')[0] : null,
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

        const result = await BillingModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();

        return {
            ...result,
            bankName: result.bankName?.bankName || null,
            billDate: result.billDate ? new Date(result.billDate).toISOString().split('T')[0] : null,
        };
    };
}

export default BillingExpenseService;
