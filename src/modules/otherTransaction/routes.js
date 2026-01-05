
import express from "express";
import OtherTransactionController from "./controller.js";

const router = express.Router();

router.post("/", OtherTransactionController.createTransaction);
router.get("/", OtherTransactionController.getAllTransactions);
router.delete("/:id", OtherTransactionController.deleteTransaction);
router.post("/delete-many", OtherTransactionController.bulkDeleteTransactions);

export default router;
