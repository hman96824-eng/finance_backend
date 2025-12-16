import express from "express";
import middleware from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";
import parseFormFields from "../../../middleware/parseFormFields.middleware.js";
import AssetController from "./controller.js";
import { validate } from "../../../middleware/validation.middleware.js";
import validation from "../../../validation/validation.js";

import { accountingPeriodMiddleware } from "../../../middleware/hardcodedPeriod.middleware.js"

const router = express.Router();

router
    .post(
        "/create",
        middleware.authenticate,
        upload.array("attachments"),
        parseFormFields,
        validate(validation.assetExpenseSchema),
        AssetController.createAsset
    )
    .put(
        "/update/:id",
        middleware.authenticate,
        upload.array("attachments"),
        parseFormFields,
        validate(validation.assetExpenseUpdateSchema),
        AssetController.updateAsset
    )
    .delete("/delete-attachments/:id", middleware.authenticate, validate(validation.deleteAttachmentsSchema), AssetController.deleteAttachments)
    .put("/upload-attachments/:id", middleware.authenticate, upload.array("attachments"), AssetController.uploadAttachments)

    .put("/soft-delete/:id", middleware.authenticate, AssetController.softDeleteAsset)
    .put("/soft-delete-many", middleware.authenticate, validate(validation.deleteManySchema), AssetController.softDeleteMany)

    .delete("/delete/:id", middleware.authenticate, AssetController.deleteAsset)
    .delete("/delete-many", middleware.authenticate, validate(validation.deleteManySchema), AssetController.deleteManyAsset)

    .get("/all-asset", middleware.authenticate, accountingPeriodMiddleware, AssetController.getAllAssets)
    .get("/:id", middleware.authenticate, AssetController.getAssetById);

export default router;
