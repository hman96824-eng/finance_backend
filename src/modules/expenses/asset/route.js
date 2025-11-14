import express from "express";
import middleware from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";
import parseFormFields from "../../../middleware/parseFormFields.middleware.js";
import AssetController from "./controller.js";

const router = express.Router();

router
    .post(
        "/create",
        middleware.authenticate,
        upload.array("attachments"),
        parseFormFields,
        AssetController.createAsset
    )
    .put(
        "/update/:id",
        middleware.authenticate,
        upload.array("attachments"),
        parseFormFields,
        AssetController.updateAsset
    )
    .delete("/delete-attachments/:id", middleware.authenticate, AssetController.deleteAttachments)
    .put("/upload-attachments/:id", middleware.authenticate, upload.array("attachments"), AssetController.uploadAttachments)

    .put("/soft-delete/:id", middleware.authenticate, AssetController.softDeleteAsset)
    .put("/soft-delete-many", middleware.authenticate, AssetController.softDeleteMany)

    .delete("/delete/:id", middleware.authenticate, AssetController.deleteAsset)
    .delete("/delete-many", middleware.authenticate, AssetController.deleteManyAsset)

    .get("/all-asset", middleware.authenticate, AssetController.getAllAssets)
    .get("/:id", middleware.authenticate, AssetController.getAssetById);

export default router;
