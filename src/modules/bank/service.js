import mongoose from "mongoose";
import BankModel from "./model.js";
import ProjectModel from "../project/model.js";
import ApiError from "../../utils/ApiError.js";
import repository from "../../utils/repository.js";
import messages from "../../constants/messages.js";


const projectRepo = new repository(ProjectModel);
const BankRepo = new repository(BankModel);

class BankService {
    static createBank = async (data, userId) => {
        try {
            const balance = data.balance || 0;
            console.log(balance, "balanace");

            // Do not allow nested payment history during initial create in general (optional)
            // Validate if provided
            if (Array.isArray(data.paymentHistory) && data.paymentHistory.length > 0) {
                for (let i = 0; i < data.paymentHistory.length; i++) {
                    const entry = data.paymentHistory[i];
                    if (!entry.project) {
                        throw ApiError.badRequest(`paymentHistory.${i}.project: Path "project" is required.`);
                    }
                    if (!mongoose.Types.ObjectId.isValid(entry.project)) {
                        throw ApiError.badRequest(`paymentHistory.${i}.project: Invalid project ID`);
                    }
                    const proj = await projectRepo.findById(entry.project);
                    if (!proj) {
                        throw ApiError.badRequest(`paymentHistory.${i}.project: Project not found`);
                    }
                }
            }

            const bank = await BankRepo.create({ ...data, createdBy: userId });
            return bank;
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    };

    static getAllBanks = async (userId) => {
        // Populate paymentHistory.project with selective fields and createdBy user
        return await BankRepo.find({ createdBy: userId })
            .populate("paymentHistory.project", "projectName clientName projectManager projectID")
            .populate("createdBy", "name email _id")
            .sort({ createdAt: -1 });
    };

    static getBankById = async (id, userId) => {
        const bank = await BankRepo.findOne({ _id: id, createdBy: userId })
            .populate("paymentHistory.project", "projectName clientName projectManager projectID")
            .populate("createdBy", "name email _id");

        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
        return bank;
    };

    static updateBank = async (id, data, userId) => {
        const bank = await BankRepo.findOneAndPopulate(
            { _id: id, createdBy: userId },
            data,
            { new: true }
        );
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
        return bank;
    };

    static deleteBank = async (id, userId) => {
        const bank = await BankRepo.findOne({ _id: id, createdBy: userId });
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

        await BankRepo.deleteOne({ _id: id, createdBy: userId });
        return bank;
    };

    // Add payment to bank and also add bankPayment entry to the project atomically
    static addPayment = async (bankId, userId, { amount, type = "credit", note, project }) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (!mongoose.Types.ObjectId.isValid(project)) {
                throw ApiError.badRequest(messages.INVALID_PROJECT_ID || "Invalid project ID format");
            }

            // Fetch bank (owned by user) with session
            const bank = await BankModel.findOne({ _id: bankId, createdBy: userId }).session(session);
            if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

            // First, let's clean up any invalid entries
            if (!Array.isArray(bank.paymentHistory)) {
                bank.paymentHistory = [];
            }

            const validPayments = [];
            for (const payment of bank.paymentHistory) {
                if (payment && payment.project && mongoose.Types.ObjectId.isValid(String(payment.project))) {
                    validPayments.push(payment);
                }
            }
            bank.paymentHistory = validPayments;

            // Fetch project and validate
            const projectDoc = await ProjectModel.findById(project).session(session);
            if (!projectDoc) throw ApiError.notFound(messages.PROJECT_NOT_FOUND);

            const amt = Number(amount) || 0;
            if (amt <= 0) throw ApiError.badRequest("Payment amount must be greater than zero");

            const paymentEntry = {
                project: projectDoc._id,
                amount: amt,
                type,
                note,
                date: new Date()
            };

            // Push payment to bank
            bank.paymentHistory.push(paymentEntry);

            // The pre-save hook will handle the balance update
            // No need to manually update balance here

            // Ensure project.bankPayments array exists and push a bankPayment snapshot
            projectDoc.bankPayments = Array.isArray(projectDoc.bankPayments) ? projectDoc.bankPayments : [];
            projectDoc.bankPayments.push({
                bank: bank._id,
                amount: amt,
                type,
                note,
                date: new Date(),
                bankSnapshot: {
                    bankName: bank.bankName,
                    accountNumber: bank.accountNumber,
                    accountTitle: bank.accountTitle
                }
            });

            // Ensure bank id is linked to project.banks
            if (!projectDoc.banks.some((b) => b.toString() === bank._id.toString())) {
                projectDoc.banks.push(bank._id);
            }

            // Update project totals (defensive)
            projectDoc.totalPaid = Number(projectDoc.totalPaid || 0) + (type === "credit" ? amt : -amt);
            if (typeof projectDoc.budget === "number") {
                projectDoc.pendingAmount = Math.max(Number(projectDoc.budget || 0) - Number(projectDoc.totalPaid || 0), 0);
            }

            // Save both docs in the session
            await bank.save({ session });
            await projectDoc.save({ session });

            await session.commitTransaction();
            session.endSession();

            // Return populated bank with selective project fields and createdBy
            return await BankModel.findById(bank._id)
                .populate("paymentHistory.project", "projectName clientName projectManager projectID")
                .populate("createdBy", "name email _id");
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            // Bubble up a useful message
            throw ApiError.badRequest(err.message || "Failed to add payment");
        }
    };

    static getPayments = async (bankId, userId) => {
        const bank = await BankRepo.findOne({ _id: bankId, createdBy: userId });
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
        return bank.paymentHistory;
    };

    static deleteManyBanks = async (bankIds, userId) => {
        try {
            if (!Array.isArray(bankIds) || bankIds.length === 0) {
                throw ApiError.badRequest(messages.NO_BANKS_SELECTED);
            }

            const result = await BankRepo.deleteMany({
                _id: { $in: bankIds },
                createdBy: userId
            });

            return result;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    };


}

export default BankService;