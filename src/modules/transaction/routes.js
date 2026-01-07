import express from "express";
import * as TransactionController from "./controller.js";

const router = express.Router();

router.post("/", TransactionController.addTransaction);
router.get("/", TransactionController.getAllTransactions);
router.delete("/:id", TransactionController.deleteTransaction);
router.post("/bulk-delete", TransactionController.bulkDeleteTransactions);

export default router;
