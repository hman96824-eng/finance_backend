import GeneralExpenseModel from "./model.js";
import Bank from "../../bank/model.js";
import Repo from "../../../utils/repository.js";
import ApiError from "../../../utils/ApiError.js";
import { deleteMedia } from "../../media/service.js";

const GeneralExpenseRepo = new Repo(GeneralExpenseModel);
const BankRepo = new Repo(Bank);

class GeneralExpenseService {
    static createExpense = async (body) => {
        const bank = await BankRepo.findById(body.bankName);
        if (!bank) throw ApiError.notFound("Bank not found");

        if (bank.balance < body.amount) throw ApiError.badRequest("Not enough bank balance");

        // Create expense first
        const createdExpense = await GeneralExpenseRepo.create(body);

        // Add to bank's expenseHistory
        bank.expenseHistory.push({
            title: body.title || "General Expense",
            date: body.purchaseDate || new Date(),
            type: "debit",
            amount: body.amount,
            expenseId: createdExpense._id,
            purchaseBy: body.purchaseBy,
            expenseType: "general"
        });

        await BankRepo.update(bank._id, {
            balance: bank.balance - body.amount,
            expenseHistory: bank.expenseHistory
        });

        return createdExpense;
    };
    static updateExpense = async (id, body) => {
        // Get existing expense to track changes
        const existingExpense = await GeneralExpenseModel.findById(id);
        if (!existingExpense) throw ApiError.notFound("General Expense not found");

        if (body.attachments && body.attachments.length > 0) {
            if (existingExpense.attachments) {
                body.attachments = [...existingExpense.attachments.map(a => a.toString()), ...body.attachments];
            }
        }

        const updated = await GeneralExpenseRepo.updateById(id, body);

        // Update bank's expenseHistory if amount or title changed
        if (existingExpense.bankName && (body.amount !== undefined || body.title !== undefined)) {
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
                        title: body.title || existingExpense.title,
                        amount: body.amount !== undefined ? body.amount : existingExpense.amount,
                        date: body.purchaseDate || existingExpense.purchaseDate,
                    };
                } else {
                    // Add new history entry if it doesn't exist
                    bank.expenseHistory.push({
                        title: body.title || existingExpense.title,
                        date: body.purchaseDate || existingExpense.purchaseDate,
                        type: "debit",
                        amount: body.amount !== undefined ? body.amount : existingExpense.amount,
                        expenseId: id,
                        purchaseBy: body.purchaseBy || existingExpense.purchaseBy,
                        expenseType: "general"
                    });
                }

                await BankRepo.update(bank._id, { expenseHistory: bank.expenseHistory });
            }
        }

        return await GeneralExpenseModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("createdBy", "name email")
            .lean();
    };
    static softDelete = async (id) => {
        return await GeneralExpenseRepo.updateById(id, { status: "Inactive", isDeleted: true });
    };
    static softDeleteMany = async (ids) => {
        return await GeneralExpenseModel.updateMany(
            { _id: { $in: ids } },
            { status: "Inactive", isDeleted: true }
        );
    };
    static deleteExpense = async (id) => {
        return await GeneralExpenseRepo.deleteById(id);
    };
    static deleteMany = async (ids) => {
        return await GeneralExpenseRepo.deleteMany({ _id: { $in: ids } });
    };
    static getAllExpenses = async () => {
        const expenses = await GeneralExpenseModel.find({ isDeleted: false })
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("createdBy", "name email")
            .select("-isDeleted")
            .lean();

        return expenses.map(exp => ({
            ...exp,
            bankName: exp.bankName?.bankName || null,
            purchaseDate: exp.purchaseDate ? new Date(exp.purchaseDate).toISOString().split('T')[0] : null,
        }));
    };
    static getExpenseById = async (id) => {
        const exp = await GeneralExpenseModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("createdBy", "name email")
            .select("-isDeleted")
            .lean();

        if (!exp) throw ApiError.notFound("Expense not found");

        return {
            ...exp,
            bankName: exp.bankName?.bankName || null,
            purchaseDate: exp.purchaseDate ? new Date(exp.purchaseDate).toISOString().split('T')[0] : null,
        };
    };
    static deleteAttachments = async (id, attachmentIds) => {
        const expense = await GeneralExpenseModel.findById(id);
        if (!expense) throw ApiError.notFound("Expense not found");

        for (const attachmentId of attachmentIds) {
            try { await deleteMedia(attachmentId); }
            catch (err) { console.error(`Failed to delete media ${attachmentId}:`, err.message); }
        }

        // Filter out the deleted attachments
        const updatedAttachments = expense.attachments.filter(a => !attachmentIds.includes(a.toString()));

        // Use findByIdAndUpdate to avoid full document validation
        await GeneralExpenseModel.findByIdAndUpdate(id, { attachments: updatedAttachments }, { new: false });

        const result = await GeneralExpenseModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("createdBy", "name email")
            .lean();

        return {
            ...result,
            bankName: result.bankName?.bankName || null,
            purchaseDate: result.purchaseDate ? new Date(result.purchaseDate).toISOString().split('T')[0] : null,
        };
    };
}

export default GeneralExpenseService;
