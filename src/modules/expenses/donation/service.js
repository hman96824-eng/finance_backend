import DonationModel from "./model.js";
import Bank from "../../bank/model.js";
import Repo from "../../../utils/repository.js";
import ApiError from "../../../utils/ApiError.js";
import { deleteMedia } from "../../media/service.js";

const DonationRepo = new Repo(DonationModel);
const BankRepo = new Repo(Bank);

class DonationExpenseService {
    static createDonation = async (body) => {
        const bank = await BankRepo.findById(body.bankName);
        if (!bank) throw ApiError.notFound("Bank not found");

        if (bank.balance < body.amount)
            throw ApiError.badRequest("Not enough bank balance");

        // Create donation first
        const createdDonation = await DonationRepo.create(body);

        // Add to bank's expenseHistory
        bank.expenseHistory.push({
            title: body.donationName || body.title || "Donation",
            date: body.donationDate || new Date(),
            type: "debit",
            amount: body.amount,
            expenseId: createdDonation._id,
            purchaseBy: body.purchaseBy,
            expenseType: "donation"
        });

        await BankRepo.update(bank._id, {
            balance: bank.balance - body.amount,
            expenseHistory: bank.expenseHistory
        });

        return createdDonation;
    };
    static updateDonation = async (id, body) => {
        // Get existing donation to track changes
        const existingDonation = await DonationModel.findById(id);
        if (!existingDonation) throw ApiError.notFound("Donation not found");

        if (body.attachments?.length > 0) {
            if (existingDonation.attachments) {
                body.attachments = [...existingDonation.attachments, ...body.attachments];
            }
        }

        await DonationRepo.updateById(id, body);

        // Update bank's expenseHistory if amount or title changed
        if (existingDonation.bankName && (body.amount !== undefined || body.donationName !== undefined || body.title !== undefined)) {
            const bank = await BankRepo.findById(existingDonation.bankName);
            if (bank) {
                // Check if this donation already exists in expenseHistory
                const existingHistoryIndex = bank.expenseHistory.findIndex(
                    (item) => item.expenseId && item.expenseId.toString() === id
                );

                if (existingHistoryIndex !== -1) {
                    // Update existing history entry
                    bank.expenseHistory[existingHistoryIndex] = {
                        ...bank.expenseHistory[existingHistoryIndex],
                        title: body.donationName || body.title || existingDonation.donationName || existingDonation.title,
                        amount: body.amount !== undefined ? body.amount : existingDonation.amount,
                        date: body.donationDate || existingDonation.donationDate,
                    };
                } else {
                    // Add new history entry if it doesn't exist
                    bank.expenseHistory.push({
                        title: body.donationName || body.title || existingDonation.donationName || existingDonation.title,
                        date: body.donationDate || existingDonation.donationDate,
                        type: "debit",
                        amount: body.amount !== undefined ? body.amount : existingDonation.amount,
                        expenseId: id,
                        purchaseBy: body.purchaseBy || existingDonation.purchaseBy,
                        expenseType: "donation"
                    });
                }

                await BankRepo.update(bank._id, { expenseHistory: bank.expenseHistory });
            }
        }

        const result = await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();

        const { bankName, ...rest } = result;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            donationDate: result.donationDate ? new Date(result.donationDate).toISOString().split('T')[0] : null,
        };
    };
    static softDelete = async (id) => {
        return await DonationRepo.updateById(id, { status: "Inactive", isDeleted: true });
    };
    static softDeleteMany = async (ids) => {
        return await DonationModel.updateMany(
            { _id: { $in: ids } },
            { status: "Inactive", isDeleted: true }
        );
    };
    static deleteDonation = async (id) => {
        return await DonationRepo.deleteById(id);
    };
    static deleteMany = async (ids) => {
        return await DonationRepo.deleteMany({ _id: { $in: ids } });
    };
    static getAllDonations = async () => {
        const donations = await DonationModel.find({ isDeleted: false })
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .select("-isDeleted")
            .lean();

        return donations.map((don) => {
            const { bankName, ...rest } = don;
            return {
                ...rest,
                bankName: bankName?.bankName || null,
                donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null,
            };

        });
    };
    static getDonationById = async (id) => {
        const don = await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .select("-isDeleted")
            .lean();

        if (!don) throw ApiError.notFound("Donation not found");

        const { bankName, ...rest } = don;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null,
        };
    };
    static deleteAttachments = async (id, attachmentIds) => {
        const donation = await DonationModel.findById(id);
        if (!donation) throw ApiError.notFound("Donation not found");

        for (const attachmentId of attachmentIds) {
            try {
                await deleteMedia(attachmentId);
            } catch (err) {
                console.error("Failed to delete media:", err.message);
            }
        }

        donation.attachments = donation.attachments.filter(
            att => !attachmentIds.includes(att.toString())
        );

        await donation.save();

        const result = await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();

        const { bankName, ...rest } = result;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            donationDate: result.donationDate ? new Date(result.donationDate).toISOString().split('T')[0] : null,
        };
    };
}


export default DonationExpenseService;