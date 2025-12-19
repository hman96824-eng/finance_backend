import express from "express";
import BankController from "./controller.js";
import Middleware from "../../middleware/auth.middleware.js";
import validation from "../../validation/validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(Middleware.authenticate);

// Write operations require admin privileges
router
  .post("/create", Middleware.checkAdmin, validate(validation.bankSchema), BankController.createBank)
  .get("/all", BankController.getAllBanks)
  .get("/:id", BankController.getBankById)
  .put("/update/:id", Middleware.checkAdmin, BankController.updateBank)
  .delete("/delete/:id", Middleware.checkAdmin, BankController.deleteBank)
  .delete("/delete-many", Middleware.checkAdmin, BankController.deleteManyBanks)

// Payment operations require admin privileges
router
  .post("/payment/:id", Middleware.checkAdmin, BankController.addPayment)
  .get("/payment/:id", BankController.getPayments)

// Commission payment requires admin privileges
router
  .post("/commission/pay", Middleware.checkAdmin, BankController.createPaymentRequest)

export default router;
