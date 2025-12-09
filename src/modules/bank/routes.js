import express from "express";
import BankController from "./controller.js";
import Middleware from "../../middleware/auth.middleware.js";
import validation from "../../validation/validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

router.use(Middleware.authenticate);

router
    .post("/create", validate(validation.bankSchema), BankController.createBank)
    .get("/all", BankController.getAllBanks)
    .get("/:id", BankController.getBankById)
    .put("/update/:id", BankController.updateBank)
    .delete("/delete/:id", BankController.deleteBank)
    .delete("/delete-many", BankController.deleteManyBanks)

router
    .post("/payment/:id", BankController.addPayment)
    .get("/payment/:id", BankController.getPayments)

router
 
  .post("/commission/pay",BankController.createPaymentRequest )

export default router;
