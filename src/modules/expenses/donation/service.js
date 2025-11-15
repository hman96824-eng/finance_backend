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

        await BankRepo.update(bank._id, { balance: bank.balance - body.amount });

        return await DonationRepo.create(body);
    };
    static updateDonation = async (id, body) => {
        if (body.attachments?.length > 0) {
            const existing = await DonationModel.findById(id).select("attachments");
            if (existing) {
                body.attachments = [...existing.attachments, ...body.attachments];
            }
        }

        await DonationRepo.updateById(id, body);

        return await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .lean();
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

        return donations.map((don) => ({
            ...don,
            bankName: don.bankName?.bankName || null,
        }));
    };
    static getDonationById = async (id) => {
        const don = await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .select("-isDeleted")
            .lean();

        if (!don) throw ApiError.notFound("Donation not found");

        return {
            ...don,
            bankName: don.bankName?.bankName || null,
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

        return await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("donatedBy", "name email")
            .lean();
    };
}


export default DonationExpenseService;