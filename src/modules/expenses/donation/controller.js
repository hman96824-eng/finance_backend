import DonationExpenseService from "./service.js";
import { uploadMedia } from "../../media/service.js";
import { UserModel } from "../../user/model.js";
import { AccountingPeriodModel } from "../../period/model.js";
import { successResponse } from "../../../utils/response.helper.js";

const DonationExpenseController = {
    createDonation: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Check currently open period
            const currentPeriod = await AccountingPeriodModel.findOne({ status: "open" });
            if (!currentPeriod) {
                throw new Error("No open accounting period. Cannot add donation.");
            }

            // Upload attachments if any
            let attachmentIds = [];
            if (req.files?.length > 0) {
                for (const file of req.files) {
                    const media = await uploadMedia(file.path, "donation-expense", userId);
                    attachmentIds.push(media._id);
                }
            }

            // Create donation with accounting period attached
            const result = await DonationExpenseService.createDonation({
                ...req.body,
                attachments: attachmentIds,
                enteredBy: userId,
                accountingPeriod: currentPeriod._id,
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

            // Get donation and its period
            const donation = await DonationExpenseService.getDonationById(req.params.id);
            if (donation.accountingPeriod) {
                const period = await AccountingPeriodModel.findById(donation.accountingPeriod);
                if (!period || period.status === "closed") {
                    throw new Error("Cannot edit donation of a closed period.");
                }
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
            if (donation.accountingPeriod) {
                const period = await AccountingPeriodModel.findById(donation.accountingPeriod);
                if (!period || period.status === "closed") {
                    throw new Error("Cannot delete donation of a closed period.");
                }
            }

            const result = await DonationExpenseService.softDelete(req.params.id);
            return successResponse(res, result, "Donation moved to trash");
        } catch (err) {
            next(err);
        }
    },

    softDeleteMany: async (req, res, next) => {
        try {
            // Optional: check periods for each ID
            const result = await DonationExpenseService.softDeleteMany(req.body.ids);
            return successResponse(res, result, "Donations moved to trash");
        } catch (err) { next(err); }
    },

    deleteDonation: async (req, res, next) => {
        try {
            const donation = await DonationExpenseService.getDonationById(req.params.id);
            if (donation.accountingPeriod) {
                const period = await AccountingPeriodModel.findById(donation.accountingPeriod);
                if (!period || period.status === "closed") {
                    throw new Error("Cannot delete donation of a closed period.");
                }
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
            // Support historical query if needed, or just default to open?
            // User requirement: "No live queries" for closed months via summary.
            // But this is likely for management view.

            // If they ask for specific period (via query param?)
            // For now, let's just return all or filter by active if needed.
            // But standard list usually shows all unless filtered.
            // The original code filtered by OPEN month if no query.

            // Let's replicate behavior: Filter by open period if no specific filter?
            // Or just return all because frontend tables usually paginate all.
            // The original code:
            /*
            if (monthKey) { ... } else { month = findOne({ status: "OPEN" }) }
            */
            // So default was showing CURRENT OPEN MONTH donations.

            const accountingPeriod = req.accountingPeriod;
            // If no period, maybe return empty or all?
            if (!accountingPeriod) {
                return successResponse(res, []);
            }

            const result = await DonationExpenseService.getDonationsByPeriod(accountingPeriod);
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
