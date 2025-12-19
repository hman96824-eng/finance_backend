import AssetService from "./service.js";
import { uploadMedia } from "../../media/service.js";
import { UserModel } from "../../user/model.js";
import { successResponse } from "../../../utils/response.helper.js";

import { AccountingPeriodModel } from "../../period/model.js";

const AssetController = {
    // ---------------- CREATE ----------------
    createAsset: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // 1. Get Active Accounting Period
            const activePeriod = await AccountingPeriodModel.findOne({ status: "open" });
            if (!activePeriod) {
                return res.status(404).json({ message: "No active month found" });
            }

            // ⭐ Step 1: Upload attachments first (before calling service)
            let attachmentIds = [];
            if (req.files?.length > 0) {
                try {
                    for (let file of req.files) {
                        const media = await uploadMedia(file.path, "assets", userId);
                        if (!media || !media._id) {
                            throw new Error("Media upload returned invalid result");
                        }
                        attachmentIds.push(media._id);
                    }
                } catch (uploadError) {
                    console.error("❌ Media upload error:", uploadError.message);
                    throw new Error(`Media upload failed: ${uploadError.message}`);
                }
            }

            // ⭐ Step 2: Get user info (name, email, role) for response only
            const user = await UserModel.findById(userId)
                .populate("role_id", "name")
                .select("name email");

            if (!user) {
                throw new Error("User not found");
            }

            const userInfo = {
                name: user.name,
                email: user.email,
                role: user.role_id?.name || null,
            };

            // ⭐ Step 3: Create asset with userId in createdBy field
            const result = await AssetService.createAsset({
                ...req.body,
                attachments: attachmentIds,
                createdBy: userId,  // Store only user ID
                accountingPeriod: activePeriod._id
            });

            return successResponse(res, {
                ...result,
                uploadedBy: userInfo.name,  // Add for frontend
                user: userInfo,
            }, "Asset created successfully");

        } catch (err) {
            next(err);
        }
    },

    // ---------------- UPDATE ----------------
    updateAsset: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // ⭐ Step 1: Upload new attachments first (if any)
            let attachmentIds = [];
            if (req.files?.length > 0) {
                try {
                    for (let file of req.files) {
                        const media = await uploadMedia(file.path, "assets", userId);
                        if (!media || !media._id) {
                            throw new Error("Media upload returned invalid result");
                        }
                        attachmentIds.push(media._id);
                    }
                } catch (uploadError) {
                    console.error("❌ Media upload error:", uploadError.message);
                    throw new Error(`Media upload failed: ${uploadError.message}`);
                }
            }

            // ⭐ Step 2: Get user info for response
            const user = await UserModel.findById(userId)
                .populate("role_id", "name")
                .select("name email");

            if (!user) {
                throw new Error("User not found");
            }

            const userInfo = {
                name: user.name,
                email: user.email,
                role: user.role_id?.name || null,
            };

            // ⭐ Step 3: Prepare update data
            const updateData = { ...req.body };

            // If new attachments uploaded, pass them (service will merge)
            if (attachmentIds.length > 0) {
                updateData.attachments = attachmentIds;
            }

            // ⭐ Step 4: Update asset
            const updated = await AssetService.updateAsset(
                req.params.id,
                updateData
            );

            return successResponse(res, {
                ...updated,
                bankName: updated.bank?.bankName || null,
                uploadedBy: updated.createdBy?.name || userInfo.name,

            }, "Asset updated successfully");

        } catch (err) {
            next(err);
        }
    },

    // ---------------- SOFT DELETE ----------------
    softDeleteAsset: async (req, res, next) => {
        try {
            const result = await AssetService.softDelete(req.params.id);
            return successResponse(res, result, "Asset moved to trash");
        } catch (err) {
            next(err);
        }
    },

    softDeleteMany: async (req, res, next) => {
        try {
            const result = await AssetService.softDeleteMany(req.body.ids);
            return successResponse(res, result, "Assets moved to trash");
        } catch (err) {
            next(err);
        }
    },

    // ---------------- HARD DELETE ----------------
    deleteAsset: async (req, res, next) => {
        try {
            const result = await AssetService.deleteAsset(req.params.id);
            return successResponse(res, result, "Asset deleted permanently");
        } catch (err) {
            next(err);
        }
    },

    deleteManyAsset: async (req, res, next) => {
        try {
            const result = await AssetService.deleteMany(req.body.ids);
            return successResponse(res, result, "Assets deleted permanently");
        } catch (err) {
            next(err);
        }
    },

    // ---------------- GET ALL / ONE ----------------
    getAllAssets: async (req, res, next) => {
        try {
            if (!req.accountingPeriod) return successResponse(res, []);

            const data = await AssetService.getAllAssets(req.accountingPeriod);
            return successResponse(res, data);
        } catch (err) {
            next(err);
        }
    },

    getAssetById: async (req, res, next) => {
        try {
            const data = await AssetService.getAssetById(req.params.id);
            return successResponse(res, data);
        } catch (err) {
            next(err);
        }
    },
    uploadAttachments: async (req, res, next) => {
        try {
            // Validate that files are present
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                    message: "At least one attachment file is required"
                });
            }

            const userId = req.user.id;
            // ⭐ Step 1: Upload new attachments first (if any)
            let attachmentIds = [];
            if (req.files?.length > 0) {
                try {
                    for (let file of req.files) {
                        const media = await uploadMedia(file.path, "assets", userId);
                        if (!media || !media._id) {
                            throw new Error("Media upload returned invalid result");
                        }
                        attachmentIds.push(media._id);
                    }
                } catch (uploadError) {
                    console.error("❌ Media upload error:", uploadError.message);
                    throw new Error(`Media upload failed: ${uploadError.message}`);
                }
            }
            // ⭐ Step 2: Update asset with new attachments
            const updated = await AssetService.updateAsset(
                req.params.id,
                { attachments: attachmentIds }
            );

            return successResponse(res, updated, "Attachments uploaded and added to asset successfully");
        } catch (err) {
            next(err);
        }
    },
    deleteAttachments: async (req, res, next) => {
        try {
            const assetId = req.params.id;
            const attachmentIds = req.body.ids || req.body.attachmentIds;

            if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
                throw new Error("Please provide valid attachment IDs in 'ids' array");
            }

            const updated = await AssetService.deleteAttachments(
                assetId,
                attachmentIds
            );
            return successResponse(res, updated, "Attachments deleted from asset successfully");
        } catch (err) {
            next(err);
        }
    }
};

export default AssetController;
