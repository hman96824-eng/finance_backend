import BusinessModel from "./model.js";
import Bank from "../../bank/model.js";
import Repo from "../../../utils/repository.js";
import ApiError from "../../../utils/ApiError.js";
import { deleteMedia } from "../../media/service.js";

const BussinessRepo = new Repo(BusinessModel);
const BankRepo = new Repo(Bank);

class BusinessExpenseService {
    static createExpense = async (body) => {
        const bank = await BankRepo.findById(body.bankName);
        if (!bank) throw ApiError.notFound("Bank not found");

        if (bank.balance < body.amount)
            throw ApiError.badRequest("Not enough bank balance");

        await BankRepo.update(bank._id, { balance: bank.balance - body.amount });

        return await BussinessRepo.create(body);
    };
    static updateExpense = async (id, body) => {
        // Merge attachments if present
        if (body.attachments && body.attachments.length > 0) {
            const existing = await BusinessModel.findById(id).select("attachments");
            if (existing && existing.attachments) {
                body.attachments = [...existing.attachments, ...body.attachments];
            }
        }

        const updated = await BussinessRepo.updateById(id, body);

        // Return populated data like assets
        const result = await BusinessModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();

        return {
            ...result,
            purchaseDate: result.purchaseDate ? result.purchaseDate.toISOString().split('T')[0] : null,
        };
    };
    static softDelete = async (id) => {
        return await BussinessRepo.updateById(id, { status: "Inactive", isDeleted: true });
    };
    static softDeleteMany = async (ids) => {
        return await BusinessModel.updateMany(
            { _id: { $in: ids } },
            { status: "Inactive", isDeleted: true }
        );
    };
    static deleteExpense = async (id) => {
        return await BussinessRepo.deleteById(id);
    };
    static deleteMany = async (ids) => {
        return await BussinessRepo.deleteMany({ _id: { $in: ids } });
    };
    static getAllExpenses = async () => {
        const expenses = await BusinessModel.find({ isDeleted: false })
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .select("-isDeleted")
            .lean();

        // Map to frontend format like assets
        return expenses.map((exp) => ({
            ...exp,
            bankName: exp.bankName?.bankName || null,
            purchaseDate: exp.purchaseDate ? exp.purchaseDate.toISOString().split('T')[0] : null,
        }));
    };
    static getExpenseById = async (id) => {
        const exp = await BusinessModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .select("-isDeleted")
            .lean();

        if (!exp) throw ApiError.notFound("Business Expense not found");

        // Map to frontend format like assets
        return {
            ...exp,
            bankName: exp.bankName?.bankName || null,
            purchaseDate: exp.purchaseDate ? exp.purchaseDate.toISOString().split('T')[0] : null,
        };
    };
    static deleteAttachments = async (id, attachmentIds) => {
        const expense = await BusinessModel.findById(id);
        if (!expense) throw ApiError.notFound("Expense not found");

        // Delete each media file from database and Cloudinary
        for (const attachmentId of attachmentIds) {
            try {
                await deleteMedia(attachmentId);
            } catch (err) {
                console.error(`Failed to delete media ${attachmentId}:`, err.message);
                // Continue deleting others even if one fails
            }
        }

        // Remove the attachment IDs from the expense's attachments array
        expense.attachments = expense.attachments.filter(
            attachment => !attachmentIds.includes(attachment.toString())
        );

        await expense.save();

        // Return populated expense
        const result = await BusinessModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();

        return {
            ...result,
            purchaseDate: result.purchaseDate ? result.purchaseDate.toISOString().split('T')[0] : null,
        };
    };
}

export default BusinessExpenseService;
