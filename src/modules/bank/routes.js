import express from "express";
import BankController from "./controller.js";
import Middleware from "../../middleware/auth.middleware.js";
import validation from "../../validation/validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

router.use(Middleware.authenticate);

router.post("/create", validate(validation.bankSchema), BankController.createBank);
router.get("/all", BankController.getAllBanks);
router.get("/:id", BankController.getBankById);
router.put("/update/:id", BankController.updateBank);
router.delete("/delete/:id", BankController.deleteBank);

router.post("/payment/:id", BankController.addPayment);
router.get("/payment/:id", BankController.getPayments);

export default router;
