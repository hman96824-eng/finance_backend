import Asset from "./model.js";
import Bank from "../../bank/model.js";
import ApiError from "../../../utils/ApiError.js";
import Repo from "../../../utils/repository.js";
import messages from "../../../constants/messages.js";
import { deleteMedia } from "../../media/service.js";

const AssetRepo = new Repo(Asset);
const BankRepo = new Repo(Bank);

class AssetService {
    // ---------------- CREATE ----------------
    static createAsset = async (body) => {
        try {
            const bank = await BankRepo.findById(body.bank);
            if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

            if (bank.balance < body.amount)
                throw ApiError.badRequest("Not enough bank balance");

            await BankRepo.update(bank._id, {
                balance: bank.balance - body.amount,
            });

            const createdAsset = await AssetRepo.create(body);

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
            // If attachments are in body, merge with existing ones
            if (body.attachments && body.attachments.length > 0) {
                const existingAsset = await Asset.findById(id).select("attachments");
                if (existingAsset && existingAsset.attachments) {
                    // Merge new attachments with existing ones
                    body.attachments = [...existingAsset.attachments, ...body.attachments];
                }
            }

            const updated = await AssetRepo.updateById(id, body);

            // Return populated data like getAssetById
            return await Asset.findById(id)
                .populate("bank", "bankName accountNumber")
                .populate("attachments", "url")
                .populate("createdBy", "name email")
                .lean();
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
    static getAllAssets = async () => {
        const assets = await Asset.find({ isDeleted: false })
            .populate("bank", "bankName accountNumber")
            .populate("attachments", "url")
            .populate("createdBy", "name email")
            .select("-isDeleted")
            .lean();

        // Map to frontend format
        return assets.map(asset => ({
            ...asset,
            bankName: asset.bank?.bankName || null,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : null,
        }));
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
        return await Asset.findById(id)
            .populate("bank", "bankName accountNumber")
            .populate("attachments", "url")
            .populate("createdBy", "name email")
            .lean();
    }

}

export default AssetService;
