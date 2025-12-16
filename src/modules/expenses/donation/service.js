// import DonationModel from "./model.js";
// import Bank from "../../bank/model.js";
// import Repo from "../../../utils/repository.js";
// import ApiError from "../../../utils/ApiError.js";
// import { deleteMedia } from "../../media/service.js";

// const DonationRepo = new Repo(DonationModel);
// const BankRepo = new Repo(Bank);

// class DonationExpenseService {
//     static createDonation = async (body) => {
//         const bank = await BankRepo.findById(body.bankName);
//         if (!bank) throw ApiError.notFound("Bank not found");

//         if (bank.balance < body.amount)
//             throw ApiError.badRequest("Not enough bank balance");

//         // Create donation first
//         const createdDonation = await DonationRepo.create(body);

//         // Add to bank's paymentHistory using new format
//         bank.paymentHistory.push({
//             project: createdDonation._id.toString(),
//             projectName: body.donationName || body.title || "Donation",
//             clientName: body.purchaseBy || "",
//             amount: body.amount,
//             type: "debit",
//             note: body.note || "",
//             date: body.donationDate || new Date()
//         });

//         await bank.save();

//         return createdDonation;
//     };
//     static updateDonation = async (id, body) => {
//         // Get existing donation to track changes
//         const existingDonation = await DonationModel.findById(id);
//         if (!existingDonation) throw ApiError.notFound("Donation not found");

//         if (body.attachments?.length > 0) {
//             if (existingDonation.attachments) {
//                 body.attachments = [...existingDonation.attachments, ...body.attachments];
//             }
//         }

//         await DonationRepo.updateById(id, body);

//         // Update bank's paymentHistory if amount or title changed
//         if (existingDonation.bankName && (body.amount !== undefined || body.donationName !== undefined || body.title !== undefined)) {
//             const bank = await BankRepo.findById(existingDonation.bankName);
//             if (bank) {
//                 // Check if this donation already exists in paymentHistory
//                 const existingHistoryIndex = bank.paymentHistory.findIndex(
//                     (item) => item.project === id
//                 );

//                 if (existingHistoryIndex !== -1) {
//                     // Update existing history entry
//                     bank.paymentHistory[existingHistoryIndex] = {
//                         ...bank.paymentHistory[existingHistoryIndex],
//                         project: id,
//                         projectName: body.donationName || body.title || existingDonation.donationName || existingDonation.title,
//                         clientName: body.purchaseBy || existingDonation.purchaseBy,
//                         amount: body.amount !== undefined ? body.amount : existingDonation.amount,
//                         date: body.donationDate || existingDonation.donationDate
//                     };
//                 } else {
//                     // Add new history entry if it doesn't exist
//                     bank.paymentHistory.push({
//                         project: id,
//                         projectName: body.donationName || body.title || existingDonation.donationName || existingDonation.title,
//                         clientName: body.purchaseBy || existingDonation.purchaseBy,
//                         amount: body.amount !== undefined ? body.amount : existingDonation.amount,
//                         type: "debit",
//                         note: body.note || existingDonation.note || "",
//                         date: body.donationDate || existingDonation.donationDate
//                     });
//                 }

//                 await bank.save();
//             }
//         }

//         const result = await DonationModel.findById(id)
//             .populate("bankName", "bankName accountNumber balance")
//             .populate("attachments", "_id url")
//             .populate("enteredBy", "name email")
//             .lean();

//         const { bankName, ...rest } = result;
//         return {
//             ...rest,
//             bankName: bankName?.bankName || null,
//             donationDate: result.donationDate ? new Date(result.donationDate).toISOString().split('T')[0] : null,
//         };
//     };
//     static softDelete = async (id) => {
//         return await DonationRepo.updateById(id, { status: "Inactive", isDeleted: true });
//     };
//     static softDeleteMany = async (ids) => {
//         return await DonationModel.updateMany(
//             { _id: { $in: ids } },
//             { status: "Inactive", isDeleted: true }
//         );
//     };
//     static deleteDonation = async (id) => {
//         return await DonationRepo.deleteById(id);
//     };
//     static deleteMany = async (ids) => {
//         return await DonationRepo.deleteMany({ _id: { $in: ids } });
//     };
//     static getAllDonations = async () => {
//         const donations = await DonationModel.find({ isDeleted: false })
//             .populate("bankName", "bankName accountNumber balance")
//             .populate("attachments", "_id url")
//             .populate("enteredBy", "name email")
//             .select("-isDeleted")
//             .lean();

//         return donations.map((don) => {
//             const { bankName, ...rest } = don;
//             return {
//                 ...rest,
//                 bankName: bankName?.bankName || null,
//                 donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null,
//             };

//         });
//     };
//     static getDonationById = async (id) => {
//         const don = await DonationModel.findById(id)
//             .populate("bankName", "bankName accountNumber balance")
//             .populate("attachments", "_id url")
//             .populate("enteredBy", "name email")
//             .select("-isDeleted")
//             .lean();

//         if (!don) throw ApiError.notFound("Donation not found");

//         const { bankName, ...rest } = don;
//         return {
//             ...rest,
//             bankName: bankName?.bankName || null,
//             donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null,
//         };
//     };
//     static deleteAttachments = async (id, attachmentIds) => {
//         const donation = await DonationModel.findById(id);
//         if (!donation) throw ApiError.notFound("Donation not found");

//         for (const attachmentId of attachmentIds) {
//             try {
//                 await deleteMedia(attachmentId);
//             } catch (err) {
//                 console.error("Failed to delete media:", err.message);
//             }
//         }

//         donation.attachments = donation.attachments.filter(
//             att => !attachmentIds.includes(att.toString())
//         );

//         await donation.save();

//         const result = await DonationModel.findById(id)
//             .populate("bankName", "bankName accountNumber")
//             .populate("attachments", "_id url")
//             .populate("enteredBy", "name email")
//             .lean();

//         const { bankName, ...rest } = result;
//         return {
//             ...rest,
//             bankName: bankName?.bankName || null,
//             donationDate: result.donationDate ? new Date(result.donationDate).toISOString().split('T')[0] : null,
//         };
//     };
// }


// export default DonationExpenseService;

import DonationModel from "./model.js";
import Bank from "../../bank/model.js";
import Repo from "../../../utils/repository.js";
import ApiError from "../../../utils/ApiError.js";
import { deleteMedia } from "../../media/service.js";
import FinancialMonth from "../../financialMonth/model.js";

const DonationRepo = new Repo(DonationModel);
const BankRepo = new Repo(Bank);

class DonationExpenseService {

    static createDonation = async (body) => {
        // Validate bank
        const bank = await BankRepo.findById(body.bankName);
        if (!bank) throw ApiError.notFound("Bank not found");

        if (bank.balance < body.amount)
            throw ApiError.badRequest("Not enough bank balance");

        // Validate financial month
        const month = await FinancialMonth.findById(body.financialMonth);
        if (!month) throw ApiError.badRequest("Financial month not found");
        if (month.status === "CLOSED")
            throw ApiError.badRequest("Cannot add donation to a closed month");

        // Create donation
        const createdDonation = await DonationRepo.create(body);

        // Add to bank's paymentHistory
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
        const existingDonation = await DonationModel.findById(id);
        if (!existingDonation) throw ApiError.notFound("Donation not found");

        // Check financial month
        const month = await FinancialMonth.findById(existingDonation.financialMonth);
        if (!month) throw ApiError.notFound("Financial month not found");
        if (month.status === "CLOSED")
            throw ApiError.badRequest("Cannot update donation of a closed month");

        // Merge attachments
        if (body.attachments?.length > 0 && existingDonation.attachments) {
            body.attachments = [...existingDonation.attachments, ...body.attachments];
        }

        await DonationRepo.updateById(id, body);

        // Update bank paymentHistory
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
            .populate("financialMonth", "monthKey status")
            .lean();

        const { bankName, financialMonth, ...rest } = result;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            financialMonth: financialMonth?.monthKey || null,
            donationDate: result.donationDate ? new Date(result.donationDate).toISOString().split('T')[0] : null
        };
    };

    static softDelete = async (id) => {
        const donation = await DonationModel.findById(id);
        if (!donation) throw ApiError.notFound("Donation not found");

        // Prevent deletion if month is closed
        const month = await FinancialMonth.findById(donation.financialMonth);
        if (month?.status === "CLOSED")
            throw ApiError.badRequest("Cannot delete donation of a closed month");

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
            .populate("financialMonth", "monthKey status")
            .lean();

        return donations.map(don => {
            const { bankName, financialMonth, ...rest } = don;
            return {
                ...rest,
                bankName: bankName?.bankName || null,
                financialMonth: financialMonth?.monthKey || null,
                donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null
            };
        });
    };

    static getDonationById = async (id) => {
        const don = await DonationModel.findById(id)
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .populate("financialMonth", "monthKey status")
            .select("-isDeleted")
            .lean();

        if (!don) throw ApiError.notFound("Donation not found");

        const { bankName, financialMonth, ...rest } = don;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            financialMonth: financialMonth?.monthKey || null,
            donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null
        };
    };

    static getDonationsByMonth = async (financialMonthId) => {
        const donations = await DonationModel.find({ isDeleted: false, financialMonth: financialMonthId })
            .populate("bankName", "bankName accountNumber balance")
            .populate("attachments", "_id url")
            .populate("enteredBy", "name email")
            .populate("financialMonth", "monthKey status")
            .lean();

        return donations.map(don => {
            const { bankName, financialMonth, ...rest } = don;
            return {
                ...rest,
                bankName: bankName?.bankName || null,
                financialMonth: financialMonth?.monthKey || null,
                donationDate: don.donationDate ? new Date(don.donationDate).toISOString().split('T')[0] : null
            };
        });
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
            .populate("financialMonth", "monthKey status")
            .lean();

        const { bankName, financialMonth, ...rest } = result;
        return {
            ...rest,
            bankName: bankName?.bankName || null,
            financialMonth: financialMonth?.monthKey || null,
            donationDate: result.donationDate ? new Date(result.donationDate).toISOString().split('T')[0] : null
        };
    };
}

export default DonationExpenseService;
