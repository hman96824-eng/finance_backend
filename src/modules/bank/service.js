import BankModel from "./model.js";
import ApiError from "../../utils/ApiError.js";
import repository from "../../utils/repository.js";
import messages from "../../constants/messages.js";

const BankRepo = new repository(BankModel);

class BankService {
    // 🟢 Create Bank (User-owned)
    static createBank = async (data, userId) => {
        try {
            const bank = await BankRepo.create({ ...data, createdBy: userId });
            return bank;
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    };

    // 🟢 Get All Banks (Owned by user)
    // Populates the project details
    static getAllBanks = async (userId) => {
        return await BankRepo.find({ createdBy: userId })
            .populate({
                path: "paymentHistory.project",
                select: "projectName clientName projectID"
            })
            .sort({ createdAt: -1 });
    };

    // 🟢 Get One (Owned by user)
    // Populates the project details
    static getBankById = async (id, userId) => {
        const bank = await BankRepo.findOne({ _id: id, createdBy: userId })
            .populate({
                path: "paymentHistory.project",
                select: "projectName clientName projectID"
            });
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
        return bank;
    };

    // 🟢 Update Bank (User-owned)
    static updateBank = async (id, data, userId) => {
        const bank = await BankRepo.findOneAndUpdate(
            { _id: id, createdBy: userId },
            data,
            { new: true }
        );
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
        return bank;
    };

    // 🟢 Delete Bank (User-owned)
    static deleteBank = async (id, userId) => {
        // First find the bank to ensure it exists and belongs to the user
        const bank = await BankRepo.findOne({ _id: id, createdBy: userId });
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

        // Then delete it
        await BankRepo.deleteOne({ _id: id, createdBy: userId });
        return bank;
    };

    // 🟢 Add Payment (Transaction-safe)
    static addPayment = async (bankId, userId, { amount, type, note, project }) => {
        try {
            const bank = await BankRepo.findOne({ _id: bankId, createdBy: userId });
            if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

            // Add payment entry
            bank.paymentHistory.push({ project, amount, type, note, date: new Date() });

            // Update total balance
            bank.totalBankBalance += type === "credit" ? amount : -amount;

            // Save changes
            await bank.save();

            return bank;
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    };

    // 🟢 Get Payment History (User-owned)
    static getPayments = async (bankId, userId) => {
        const bank = await BankRepo.findOne({ _id: bankId, createdBy: userId });
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
        return bank.paymentHistory;
    };
}

export default BankService;
