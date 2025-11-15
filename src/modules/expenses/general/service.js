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

        // Deduct bank balance
        await BankRepo.update(bank._id, { balance: bank.balance - body.amount });

        return await GeneralExpenseRepo.create(body);
    };
    static updateExpense = async (id, body) => {
        if (body.attachments && body.attachments.length > 0) {
            const existing = await GeneralExpenseModel.findById(id).select("attachments");
            if (existing && existing.attachments) {
                body.attachments = [...existing.attachments.map(a => a.toString()), ...body.attachments];
            }
        }

        const updated = await GeneralExpenseRepo.updateById(id, body);

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
            date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : null,
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
            date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : null,
        };
    };
    static deleteAttachments = async (id, attachmentIds) => {
        const expense = await GeneralExpenseModel.findById(id);
        if (!expense) throw ApiError.notFound("Expense not found");

        for (const attachmentId of attachmentIds) {
            try { await deleteMedia(attachmentId); }
            catch (err) { console.error(`Failed to delete media ${attachmentId}:`, err.message); }
        }

        expense.attachments = expense.attachments.filter(a => !attachmentIds.includes(a.toString()));
        await expense.save();

        return await GeneralExpenseModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("createdBy", "name email")
            .lean();
    };
}

export default GeneralExpenseService;
