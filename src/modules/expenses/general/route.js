import express from "express";
import middleware from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";
import parseFormFields from "../../../middleware/parseFormFields.middleware.js";
import GeneralExpenseController from "./controller.js";
import { validate } from "../../../middleware/validation.middleware.js";
import validation from "../../../validation/validation.js";

import { accountingPeriodMiddleware } from "../../../middleware/hardcodedPeriod.middleware.js"

const router = express.Router();

// Middleware stack for routes with file uploads
const uploadMiddleware = [middleware.authenticate, upload.array("attachments"), parseFormFields];

// ---------- General Expense Routes ----------
// ⚠️ IMPORTANT: More specific routes must come BEFORE less specific routes (e.g., /:id)

router.delete("/delete-attachments/:id", middleware.authenticate, validate(validation.deleteAttachmentsSchema), GeneralExpenseController.deleteAttachments);
// Specific action routes (before generic /:id)
router.post("/create", uploadMiddleware, validate(validation.generalExpenseSchema), GeneralExpenseController.createExpense);
router.put("/upload-attachments/:id", uploadMiddleware, GeneralExpenseController.uploadAttachments);
router.put("/soft-delete/:id", middleware.authenticate, GeneralExpenseController.softDeleteExpense);
router.put("/soft-delete-many", middleware.authenticate, validate(validation.deleteManySchema), GeneralExpenseController.softDeleteMany);
router.delete("/delete/:id", middleware.authenticate, GeneralExpenseController.deleteExpense);
router.delete("/delete-many", middleware.authenticate, validate(validation.deleteManySchema), GeneralExpenseController.deleteManyExpense);
router.put("/update/:id", uploadMiddleware, validate(validation.generalExpenseUpdateSchema), GeneralExpenseController.updateExpense);

// Generic routes (after specific ones)
router.get("/all", middleware.authenticate, accountingPeriodMiddleware, GeneralExpenseController.getAllExpenses);
router.get("/:id", middleware.authenticate, GeneralExpenseController.getExpenseById);

export default router;
