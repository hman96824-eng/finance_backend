import express from "express";
import middleware from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";
import parseFormFields from "../../../middleware/parseFormFields.middleware.js";
import DonationExpenseController from "./controller.js";
import { validate } from "../../../middleware/validation.middleware.js";
import validation from "../../../validation/validation.js";

const router = express.Router();

const uploadMiddleware = [
    middleware.authenticate,
    upload.array("attachments"),
    parseFormFields
];

router
    .post("/create", uploadMiddleware, validate(validation.donationExpenseSchema), DonationExpenseController.createDonation)
    .get("/all", middleware.authenticate, DonationExpenseController.getAllDonations)
    .get("/:id", middleware.authenticate, DonationExpenseController.getDonationById)

    .put("/update/:id", uploadMiddleware, validate(validation.donationExpenseUpdateSchema), DonationExpenseController.updateDonation)
    .put("/soft-delete/:id", middleware.authenticate, DonationExpenseController.softDeleteDonation)
    .put("/soft-delete-many", middleware.authenticate, validate(validation.deleteManySchema), DonationExpenseController.softDeleteMany)

    .delete("/delete/:id", middleware.authenticate, DonationExpenseController.deleteDonation)
    .delete("/delete-many", middleware.authenticate, validate(validation.deleteManySchema), DonationExpenseController.deleteManyDonation)

    .delete("/delete-attachments/:id", middleware.authenticate, validate(validation.deleteAttachmentsSchema), DonationExpenseController.deleteAttachments)
    .put("/upload-attachments/:id", uploadMiddleware, DonationExpenseController.uploadAttachments);

export default router;
