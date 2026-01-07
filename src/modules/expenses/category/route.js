import express from "express";
import ExpenseCategoryController from "./controller.js";

const router = express.Router();

router.post("/", ExpenseCategoryController.createCategory);
router.get("/", ExpenseCategoryController.getAllCategories);
router.delete("/:id", ExpenseCategoryController.deleteCategory);

export default router;
