import express from "express";
import middleware from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";
import parseFormFields from "../../../middleware/parseFormFields.middleware.js";
import BillingExpenseController from "./controller.js";
import { validate } from "../../../middleware/validation.middleware.js";
import validation from "../../../validation/validation.js";

const router = express.Router();

// Middleware stack for routes that include file uploads
const uploadMiddleware = [middleware.authenticate, upload.array("attachments"), parseFormFields];

// ---------- Billing Expense Routes ----------
router
    .post("/create", uploadMiddleware, validate(validation.billingExpenseSchema), BillingExpenseController.createExpense)
    .get("/all", middleware.authenticate, BillingExpenseController.getAllExpenses)
    .get("/:id", middleware.authenticate, BillingExpenseController.getExpenseById)

    .put("/update/:id", uploadMiddleware, validate(validation.billingExpenseUpdateSchema), BillingExpenseController.updateExpense)
    .put("/soft-delete/:id", middleware.authenticate, BillingExpenseController.softDeleteExpense)
    .put("/soft-delete-many", middleware.authenticate, validate(validation.deleteManySchema), BillingExpenseController.softDeleteMany)

    .delete("/delete/:id", middleware.authenticate, BillingExpenseController.deleteExpense)
    .delete("/delete-many", middleware.authenticate, validate(validation.deleteManySchema), BillingExpenseController.deleteManyExpense)

    .delete("/delete-attachments/:id", middleware.authenticate, validate(validation.deleteAttachmentsSchema), BillingExpenseController.deleteAttachments)
    .put("/upload-attachments/:id", uploadMiddleware, BillingExpenseController.uploadAttachments);

export default router;
