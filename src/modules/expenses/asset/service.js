import Asset from "./model.js";
import Bank from "../../bank/model.js";
import ApiError from "../../../utils/ApiError.js";
import Repo from "../../../utils/repository.js";
import messages from "../../../constants/messages.js";
import { deleteMedia } from "../../media/service.js";
import BankService from "../../bank/service.js";
import { validateExpenseDate } from "../../../utils/dateValidation.js";


const AssetRepo = new Repo(Asset);
const BankRepo = new Repo(Bank);

class AssetService {
    // ---------------- CREATE ----------------
    static createAsset = async (body) => {
        try {
            await validateExpenseDate(body.purchaseDate, "Purchase Date");
            const bank = await BankRepo.findById(body.bank);

            if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

            if (bank.balance < body.amount)
                throw ApiError.badRequest("Not enough bank balance");

            // Create asset first
            const createdAsset = await AssetRepo.create(body);

            // Add to bank's payment history (this also triggers balance update via pre-save hook)
            await BankService.addExpenseToBank(body.bank, {
                _id: createdAsset._id,
                title: body.title,
                purchaseBy: body.purchaseBy,
                amount: body.amount,
                expenseType: "assets",
                note: body.note,
                date: body.purchaseDate,
            });

            // Populate bank and attachments before returning
            return await Asset.findById(createdAsset._id)
                .populate("bank", "bankName accountNumber")
                .populate("attachments", "url")
                .lean();
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    };

    // ---------------- UPDATE ----------------
    static updateAsset = async (id, body) => {
        try {
            if (body.purchaseDate) {
                await validateExpenseDate(body.purchaseDate, "Purchase Date");
            }
            // Get existing asset to track changes
            const existingAsset = await Asset.findById(id);

            if (!existingAsset) throw ApiError.notFound("Asset not found");

            // If attachments are in body, merge with existing ones
            if (body.attachments && body.attachments.length > 0) {
                if (existingAsset.attachments) {
                    // Merge new attachments with existing ones
                    body.attachments = [...existingAsset.attachments, ...body.attachments];
                }
            }

            const updated = await AssetRepo.updateById(id, body);

            // Update bank's paymentHistory if amount or title changed
            if (existingAsset.bank && (body.amount !== undefined || body.title !== undefined)) {
                const bank = await BankRepo.findById(existingAsset.bank);
                if (bank) {
                    // Check if this asset already exists in paymentHistory
                    const existingHistoryIndex = bank.paymentHistory.findIndex(
                        (item) => item.project === id
                    );

                    if (existingHistoryIndex !== -1) {
                        // Update existing history entry
                        bank.paymentHistory[existingHistoryIndex] = {
                            ...bank.paymentHistory[existingHistoryIndex],
                            project: id,
                            projectName: body.title || existingAsset.title,
                            clientName: body.purchaseBy || existingAsset.purchaseBy,
                            amount: body.amount !== undefined ? body.amount : existingAsset.amount,
                            date: body.purchaseDate || existingAsset.purchaseDate
                        };
                    } else {
                        // Add new history entry if it doesn't exist
                        bank.paymentHistory.push({
                            project: id,
                            projectName: body.title || existingAsset.title,
                            clientName: body.purchaseBy || existingAsset.purchaseBy,
                            amount: body.amount !== undefined ? body.amount : existingAsset.amount,
                            type: "debit",
                            note: body.note || existingAsset.note || "",
                            date: body.purchaseDate || existingAsset.purchaseDate
                        });
                    }

                    await bank.save();
                }
            }

            // Return populated data like getAssetById
            const result = await Asset.findById(id)
                .populate("bank", "bankName accountNumber")
                .populate("attachments", "url")
                .populate("createdBy", "name email")
                .lean();

            return {
                ...result,
                bankName: result.bank?.bankName || null,
                purchaseDate: result.purchaseDate ? new Date(result.purchaseDate).toISOString().split('T')[0] : null,
            };
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    };

    // ---------------- SOFT DELETE ----------------
    static softDelete = async (id) => {
        return await AssetRepo.updateById(id, { status: "Inactive", isDeleted: true });
    };

    static softDeleteMany = async (ids) => {
        return await Asset.updateMany(
            { _id: { $in: ids } },
            { $set: { status: "Inactive", isDeleted: true } }
        );
    };

    // ---------------- HARD DELETE ----------------
    static deleteAsset = async (id) => {
        return await AssetRepo.deleteById(id);
    };

    static deleteMany = async (ids) => {
        return await AssetRepo.deleteMany({ _id: { $in: ids } });
    };

    // ---------------- GET ----------------
    static getAllAssets = async (accountingPeriod, page = 1, limit = 10) => {
        const skip = (Number(page) - 1) * Number(limit);
        const query = { isDeleted: false };
        if (accountingPeriod) {
            if (accountingPeriod._id) {
                query.accountingPeriod = accountingPeriod._id;
            } else {
                const { startDate, endDate } = accountingPeriod;
                query.purchaseDate = { $gte: startDate, $lte: endDate };
            }
        }

        const total = await Asset.countDocuments(query);
        const assets = await Asset.find(query)
            .populate("bank", "bankName accountNumber")
            .populate("attachments", "url")
            .populate("createdBy", "name email")
            .select("-isDeleted")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Map to frontend format
        const data = assets.map(asset => ({
            ...asset,
            bankName: asset.bank?.bankName || null,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : null,
        }));

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

    static getAssetById = async (id) => {
        const asset = await Asset.findById(id)
            .populate("bank", "bankName accountNumber")
            .populate("attachments", "url")
            .populate("createdBy", "name email")
            .select("-isDeleted")
            .lean();

        if (!asset) throw ApiError.notFound("Asset not found");

        // Map to frontend format
        return {
            ...asset,
            bankName: asset.bank?.bankName || null,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : null,
        };
    };
    static deleteAttachments = async (id, attachmentIds) => {
        const asset = await Asset.findById(id);
        if (!asset) throw ApiError.notFound("Asset not found");

        // Delete each media file from database and Cloudinary
        for (const attachmentId of attachmentIds) {
            try {
                await deleteMedia(attachmentId);
            } catch (err) {
                console.error(`Failed to delete media ${attachmentId}:`, err.message);
                // Continue deleting others even if one fails
            }
        }

        // Remove the attachment IDs from the asset's attachments array
        asset.attachments = asset.attachments.filter(
            attachment => !attachmentIds.includes(attachment.toString())
        );

        await asset.save();

        // Return populated asset
        const result = await Asset.findById(id)
            .populate("bank", "bankName accountNumber")
            .populate("attachments", "url")
            .populate("createdBy", "name email")
            .lean();

        return {
            ...result,
            bankName: result.bank?.bankName || null,
            purchaseDate: result.purchaseDate ? new Date(result.purchaseDate).toISOString().split('T')[0] : null,
        };
    }

}

export default AssetService;
