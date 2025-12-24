import DonationModel from "./model.js";
import Bank from "../../bank/model.js";
import Repo from "../../../utils/repository.js";
import ApiError from "../../../utils/ApiError.js";
import { deleteMedia } from "../../media/service.js";
import { AccountingPeriodModel } from "../../period/model.js";
import { validateExpenseDate } from "../../../utils/dateValidation.js";


const DonationRepo = new Repo(DonationModel);
const BankRepo = new Repo(Bank);

class DonationExpenseService {
    static createDonation = async (body) => {
        await validateExpenseDate(body.donationDate, "Donation Date");
        const bank = await BankRepo.findById(body.bankName);

        if (!bank) throw ApiError.notFound("Bank not found");

        if (bank.balance < body.amount)
            throw ApiError.badRequest("Not enough bank balance");

        // Validate accounting period
        const period = await AccountingPeriodModel.findById(body.accountingPeriod);
        if (!period) throw ApiError.badRequest("Accounting period not found");
        if (period.status === "closed")
            throw ApiError.badRequest("Cannot add donation to a closed period");

        const createdDonation = await DonationRepo.create(body);

        bank.paymentHistory.push({
            project: createdDonation._id.toString(),
            projectName: body.donationName || body.title || "Donation",
            clientName: body.purchaseBy || "",
            amount: body.amount,
            type: "debit",
            note: body.note || "",
            date: body.donationDate || new Date()
        });

        await bank.save();
        return createdDonation;
    };

    static updateDonation = async (id, body) => {
        if (body.donationDate) {
            await validateExpenseDate(body.donationDate, "Donation Date");
        }
        const existingDonation = await DonationModel.findById(id);

        if (!existingDonation) throw ApiError.notFound("Donation not found");

        // Check if period is closed
        if (existingDonation.accountingPeriod) {
            const period = await AccountingPeriodModel.findById(existingDonation.accountingPeriod);
            if (period && period.status === "closed")
                throw ApiError.badRequest("Cannot update donation of a closed period");
        }

        if (body.attachments?.length > 0 && existingDonation.attachments) {
            body.attachments = [...existingDonation.attachments, ...body.attachments];
        }

        await DonationRepo.updateById(id, body);

        if (existingDonation.bankName && (body.amount !== undefined || body.donationName !== undefined || body.title !== undefined)) {
            const bank = await BankRepo.findById(existingDonation.bankName);
            if (bank) {
                const existingIndex = bank.paymentHistory.findIndex(item => item.project === id);
                if (existingIndex !== -1) {
                    bank.paymentHistory[existingIndex] = {
                        ...bank.paymentHistory[existingIndex],
                        project: id,
                        projectName: body.donationName || body.title || existingDonation.donationName || existingDonation.title,
                        clientName: body.purchaseBy || existingDonation.purchaseBy,
                        amount: body.amount !== undefined ? body.amount : existingDonation.amount,
                        date: body.donationDate || existingDonation.donationDate
                    };
                } else {
                    bank.paymentHistory.push({
                        project: id,
                        projectName: body.donationName || body.title || existingDonation.donationName || existingDonation.title,
                        clientName: body.purchaseBy || existingDonation.purchaseBy,
                        amount: body.amount !== undefined ? body.amount : existingDonation.amount,
                        type: "debit",
                        note: body.note || existingDonation.note || "",
                        date: body.donationDate || existingDonation.donationDate
                    });
                }
                await bank.save();
            }
        }

        const result = await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .populate("accountingPeriod", "startDate endDate status")
            .lean();

        const { bankName, accountingPeriod, ...rest } = result;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            accountingPeriod: accountingPeriod || null,
            donationDate: result.donationDate ? new Date(result.donationDate).toISOString().split('T')[0] : null
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

    static getAllDonations = async (page = 1, limit = 10) => {
        const skip = (Number(page) - 1) * Number(limit);
        const query = { isDeleted: false };
        const total = await DonationModel.countDocuments(query);
        const donations = await DonationModel.find(query)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .populate("accountingPeriod", "startDate endDate status")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const data = donations.map(don => {
            const { bankName, accountingPeriod, ...rest } = don;
            return {
                ...rest,
                bankName: bankName?.bankName || null,
                accountingPeriod: accountingPeriod || null,
                donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null
            };
        });

        return {
            data,
            pagination: {
                total,
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                pageSize: Number(limit),
            }
        };
    };

    static getDonationById = async (id) => {
        const don = await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .populate("accountingPeriod", "startDate endDate status")
            .select("-isDeleted")
            .lean();

        if (!don) throw ApiError.notFound("Donation not found");

        const { bankName, accountingPeriod, ...rest } = don;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            accountingPeriod: accountingPeriod || null,
            donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null
        };
    };

    static getDonationsByPeriod = async (accountingPeriod, page = 1, limit = 10, search = "") => {
        const skip = (Number(page) - 1) * Number(limit);
        const query = { isDeleted: false };
        if (accountingPeriod) {
            if (accountingPeriod._id) {
                query.accountingPeriod = accountingPeriod._id;
            } else if (accountingPeriod.startDate && accountingPeriod.endDate) {
                query.donationDate = { $gte: accountingPeriod.startDate, $lte: accountingPeriod.endDate };
            }
        }

        if (search) {
            query.donationName = { $regex: search, $options: "i" };
        }

        const total = await DonationModel.countDocuments(query);
        const donations = await DonationModel.find(query)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .populate("accountingPeriod", "startDate endDate status")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const data = donations.map(don => {
            const { bankName, accountingPeriod, ...rest } = don;
            return {
                ...rest,
                bankName: bankName?.bankName || null,
                accountingPeriod: accountingPeriod || null,
                donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null
            };
        });

        return {
            data,
            pagination: {
                total,
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                pageSize: Number(limit),
            }
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

        donation.attachments = donation.attachments.filter(att => !attachmentIds.includes(att.toString()));
        await donation.save();

        const result = await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .populate("accountingPeriod", "startDate endDate status")
            .lean();

        const { bankName, accountingPeriod, ...rest } = result;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            accountingPeriod: accountingPeriod || null,
            donationDate: result.donationDate ? new Date(result.donationDate).toISOString().split('T')[0] : null
        };
    };
}

export default DonationExpenseService;
