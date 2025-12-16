// import DonationExpenseService from "./service.js";
// import { uploadMedia } from "../../media/service.js";
// import { UserModel } from "../../user/model.js";
// import { successResponse } from "../../../utils/response.helper.js";

// const DonationExpenseController = {
//     createDonation: async (req, res, next) => {
//         try {
//             const userId = req.user.id;

//             let attachmentIds = [];
//             if (req.files?.length > 0) {
//                 for (const file of req.files) {
//                     const media = await uploadMedia(file.path, "donation-expense", userId);
//                     attachmentIds.push(media._id);
//                 }
//             }

//             const result = await DonationExpenseService.createDonation({
//                 ...req.body,
//                 attachments: attachmentIds,
//                 enteredBy: userId,
//             });

//             const populated = await DonationExpenseService.getDonationById(result._id);

//             return successResponse(res, populated, "Donation added successfully");
//         } catch (err) {
//             next(err);
//         }
//     },
//     updateDonation: async (req, res, next) => {
//         try {
//             const userId = req.user.id;
//             let newAttachments = [];

//             if (req.files?.length > 0) {
//                 for (const file of req.files) {
//                     const media = await uploadMedia(file.path, "donation-expense", userId);
//                     newAttachments.push(media._id);
//                 }
//             }

//             const updated = await DonationExpenseService.updateDonation(
//                 req.params.id,
//                 { ...req.body, attachments: newAttachments }
//             );

//             return successResponse(res, updated, "Donation updated successfully");
//         } catch (err) {
//             next(err);
//         }
//     },
//     softDeleteDonation: async (req, res, next) => {
//         try {
//             const result = await DonationExpenseService.softDelete(req.params.id);
//             return successResponse(res, result, "Donation moved to trash");
//         } catch (err) { next(err); }
//     },
//     softDeleteMany: async (req, res, next) => {
//         try {
//             const result = await DonationExpenseService.softDeleteMany(req.body.ids);
//             return successResponse(res, result, "Donations moved to trash");
//         } catch (err) { next(err); }
//     },
//     deleteDonation: async (req, res, next) => {
//         try {
//             const result = await DonationExpenseService.deleteDonation(req.params.id);
//             return successResponse(res, result, "Donation deleted permanently");
//         } catch (err) { next(err); }
//     },
//     deleteManyDonation: async (req, res, next) => {
//         try {
//             const result = await DonationExpenseService.deleteMany(req.body.ids);
//             return successResponse(res, result, "Donations deleted permanently");
//         } catch (err) { next(err); }
//     },
//     getAllDonations: async (req, res, next) => {
//         try {
//             const result = await DonationExpenseService.getAllDonations();
//             return successResponse(res, result);
//         } catch (err) { next(err); }
//     },
//     getDonationById: async (req, res, next) => {
//         try {
//             const result = await DonationExpenseService.getDonationById(req.params.id);
//             return successResponse(res, result);
//         } catch (err) { next(err); }
//     },
//     deleteAttachments: async (req, res, next) => {
//         try {
//             const expenseId = req.params.id;
//             const attachmentIds = req.body.ids || req.body.attachmentIds;

//             if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
//                 throw new Error("Please provide valid attachment IDs in 'ids' array");
//             }
//             const updated = await DonationExpenseService.deleteAttachments(
//                 expenseId,
//                 attachmentIds
//             );
//             return successResponse(res, updated, "Attachments deleted");
//         } catch (err) { next(err); }
//     },
//     uploadAttachments: async (req, res, next) => {
//         try {
//             const userId = req.user.id;

//             let attachmentIds = [];
//             if (req.files?.length > 0) {
//                 for (const file of req.files) {
//                     const media = await uploadMedia(file.path, "donation-expense", userId);
//                     attachmentIds.push(media._id);
//                 }
//             }

//             const updated = await DonationExpenseService.updateDonation(
//                 req.params.id,
//                 { attachments: attachmentIds }
//             );

//             return successResponse(res, updated, "Attachments uploaded successfully");
//         } catch (err) { next(err); }
//     }
// };

// export default DonationExpenseController;
import DonationExpenseService from "./service.js";
import { uploadMedia } from "../../media/service.js";
import { UserModel } from "../../user/model.js";
import FinancialMonth from "../../financialMonth/model.js";
import { successResponse } from "../../../utils/response.helper.js";

const DonationExpenseController = {
    createDonation: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Check currently open month
            const currentMonth = await FinancialMonth.findOne({ status: "OPEN" });
            if (!currentMonth) {
                throw new Error("No open financial month. Cannot add donation.");
            }

            // Upload attachments if any
            let attachmentIds = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "donation-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            // Create donation with financial month attached
            const result = await DonationExpenseService.createDonation({
                ...req.body,
                attachments: attachmentIds,
                enteredBy: userId,
                financialMonth: currentMonth._id,
            });

            const populated = await DonationExpenseService.getDonationById(result._id);

            return successResponse(res, populated, "Donation added successfully");
        } catch (err) {
            next(err);
        }
    },

    updateDonation: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Get donation and its financial month
            const donation = await DonationExpenseService.getDonationById(req.params.id);
            const month = await FinancialMonth.findById(donation.financialMonth);
            if (!month || month.status === "CLOSED") {
                throw new Error("Cannot edit donation of a closed month.");
            }

            // Upload new attachments if any
            let newAttachments = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "donation-expense", userId);
                    newAttachments.push(media._id);
                }
            }

            const updated = await DonationExpenseService.updateDonation(
                req.params.id,
                { ...req.body, attachments: newAttachments }
            );

            return successResponse(res, updated, "Donation updated successfully");
        } catch (err) {
            next(err);
        }
    },

    softDeleteDonation: async (req, res, next) => {
        try {
            const donation = await DonationExpenseService.getDonationById(req.params.id);
            const month = await FinancialMonth.findById(donation.financialMonth);
            if (!month || month.status === "CLOSED") {
                throw new Error("Cannot delete donation of a closed month.");
            }

            const result = await DonationExpenseService.softDelete(req.params.id);
            return successResponse(res, result, "Donation moved to trash");
        } catch (err) {
            next(err);
        }
    },

    softDeleteMany: async (req, res, next) => {
        try {
            // Optional: check months for each ID
            const result = await DonationExpenseService.softDeleteMany(req.body.ids);
            return successResponse(res, result, "Donations moved to trash");
        } catch (err) { next(err); }
    },

    deleteDonation: async (req, res, next) => {
        try {
            const donation = await DonationExpenseService.getDonationById(req.params.id);
            const month = await FinancialMonth.findById(donation.financialMonth);
            if (!month || month.status === "CLOSED") {
                throw new Error("Cannot delete donation of a closed month.");
            }

            const result = await DonationExpenseService.deleteDonation(req.params.id);
            return successResponse(res, result, "Donation deleted permanently");
        } catch (err) { next(err); }
    },

    deleteManyDonation: async (req, res, next) => {
        try {
            const result = await DonationExpenseService.deleteMany(req.body.ids);
            return successResponse(res, result, "Donations deleted permanently");
        } catch (err) { next(err); }
    },

    getAllDonations: async (req, res, next) => {
        try {
            // Support historical month query
            const monthKey = req.query.month;
            let month;
            if (monthKey) {
                month = await FinancialMonth.findOne({ monthKey });
                if (!month) throw new Error("Month not found.");
            } else {
                month = await FinancialMonth.findOne({ status: "OPEN" });
                if (!month) throw new Error("No open financial month.");
            }

            const result = await DonationExpenseService.getDonationsByMonth(month._id);
            return successResponse(res, result);
        } catch (err) { next(err); }
    },

    getDonationById: async (req, res, next) => {
        try {
            const result = await DonationExpenseService.getDonationById(req.params.id);
            return successResponse(res, result);
        } catch (err) { next(err); }
    },

    deleteAttachments: async (req, res, next) => {
        try {
            const expenseId = req.params.id;
            const attachmentIds = req.body.ids || req.body.attachmentIds;

            if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
                throw new Error("Please provide valid attachment IDs in 'ids' array");
            }

            const updated = await DonationExpenseService.deleteAttachments(expenseId, attachmentIds);
            return successResponse(res, updated, "Attachments deleted");
        } catch (err) { next(err); }
    },

    uploadAttachments: async (req, res, next) => {
        try {
            const userId = req.user.id;
            let attachmentIds = [];

            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "donation-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            const updated = await DonationExpenseService.updateDonation(
                req.params.id,
                { attachments: attachmentIds }
            );

            return successResponse(res, updated, "Attachments uploaded successfully");
        } catch (err) { next(err); }
    }
};

export default DonationExpenseController;
