import express from "express";
import middleware from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";
import parseFormFields from "../../../middleware/parseFormFields.middleware.js";
import BusinessExpenseController from "./controller.js";
import { validate } from "../../../middleware/validation.middleware.js";
import validation from "../../../validation/validation.js";

const router = express.Router();

// Middleware stack for routes that include file uploads
const uploadMiddleware = [middleware.authenticate, upload.array("attachments"), parseFormFields];

// ---------- Business Expense Routes ----------

router
    .post("/create", uploadMiddleware, validate(validation.businessExpenseSchema), BusinessExpenseController.createExpense)
    .get("/all", middleware.authenticate, BusinessExpenseController.getAllExpenses)
    .get("/:id", middleware.authenticate, BusinessExpenseController.getExpenseById)

    .put("/update/:id", uploadMiddleware, validate(validation.businessExpenseUpdateSchema), BusinessExpenseController.updateExpense)
    .put("/soft-delete/:id", middleware.authenticate, BusinessExpenseController.softDeleteExpense)
    .put("/soft-delete-many", middleware.authenticate, validate(validation.deleteManySchema), BusinessExpenseController.softDeleteMany)

    .delete("/delete/:id", middleware.authenticate, BusinessExpenseController.deleteExpense)
    .delete("/delete-many", middleware.authenticate, validate(validation.deleteManySchema), BusinessExpenseController.deleteManyExpense)

    .delete("/delete-attachments/:id", middleware.authenticate, validate(validation.deleteAttachmentsSchema), BusinessExpenseController.deleteAttachments)
    .put("/upload-attachments/:id", uploadMiddleware, BusinessExpenseController.uploadAttachments)

export default router;
