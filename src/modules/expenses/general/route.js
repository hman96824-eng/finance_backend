import express from "express";
import middleware from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";
import parseFormFields from "../../../middleware/parseFormFields.middleware.js";
import GeneralExpenseController from "./controller.js";
import { validate } from "../../../middleware/validation.middleware.js";
import validation from "../../../validation/validation.js";

const router = express.Router();

// Middleware stack for routes with file uploads
const uploadMiddleware = [middleware.authenticate, upload.array("attachments"), parseFormFields];

// ---------- General Expense Routes ----------
router
    .post("/create", uploadMiddleware, validate(validation.generalExpenseSchema), GeneralExpenseController.createExpense)
    .get("/all", middleware.authenticate, GeneralExpenseController.getAllExpenses)
    .get("/:id", middleware.authenticate, GeneralExpenseController.getExpenseById)

    .put("/update/:id", uploadMiddleware, validate(validation.generalExpenseUpdateSchema), GeneralExpenseController.updateExpense)
    .put("/soft-delete/:id", middleware.authenticate, GeneralExpenseController.softDeleteExpense)
    .put("/soft-delete-many", middleware.authenticate, validate(validation.deleteManySchema), GeneralExpenseController.softDeleteMany)

    .delete("/delete/:id", middleware.authenticate, GeneralExpenseController.deleteExpense)
    .delete("/delete-many", middleware.authenticate, validate(validation.deleteManySchema), GeneralExpenseController.deleteManyExpense)

    .delete("/delete-attachments/:id", middleware.authenticate, validate(validation.deleteAttachmentsSchema), GeneralExpenseController.deleteAttachments)
    .put("/upload-attachments/:id", uploadMiddleware, GeneralExpenseController.uploadAttachments);

export default router;
