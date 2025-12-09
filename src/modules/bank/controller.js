import BankService from "./service.js";
import ApiError from "../../utils/ApiError.js";
import { successResponse } from "../../utils/response.helper.js";

const BankController = {
  createBank: async (req, res, next) => {
    try {
      const bank = await BankService.createBank(req.body, req.user.id);
      return successResponse(res, bank, "Bank created Successfully");
    } catch (err) {
      next(err);
    }
  },
  getAllBanks: async (req, res, next) => {
    try {
      console.log(req.user.id, "asciiew");
      
      const banks = await BankService.getAllBanks(req.user.id);
      console.log(banks, 'check 2 ');
      return successResponse(res, banks, "Banks fetched Successfully");
    } catch (err) {
      next(err);
    }
  },
  getBankById: async (req, res, next) => {
    try {
      const bank = await BankService.getBankById(req.params.id, req.user.id);
      return successResponse(res, bank);
    } catch (err) {
      next(err);
    }
  },
  updateBank: async (req, res, next) => {
    try {
      const bank = await BankService.updateBank(
        req.params.id,
        req.body,
        req.user.id
      );
      return successResponse(res, bank);
    } catch (err) {
      next(err);
    }
  },
  deleteBank: async (req, res, next) => {
    try {
      const bank = await BankService.deleteBank(req.params.id, req.user.id);

      return successResponse(res, bank, "Bank deleted Successfully");
    } catch (err) {
      next(err);
    }
  },
  addPayment: async (req, res, next) => {
    try {
      // Convert amount to number if it's a string
      const paymentData = {
        ...req.body,
        amount: Number(req.body.amount),
      };

      const bank = await BankService.addPayment(
        req.params.id,
        req.user.id,
        paymentData
      );
      return successResponse(res, bank, "Payment added successfully");
    } catch (err) {
      next(err);
    }
  },
  getPayments: async (req, res, next) => {
    try {
      const payments = await BankService.getPayments(
        req.params.id,
        req.user.id
      );
      return successResponse(res, payments);
    } catch (err) {
      next(err);
    }
  },
  deleteManyBanks: async (req, res, next) => {
    try {
      const bankIds = req.body;
      const result = await BankService.deleteManyBanks(bankIds, req.user.id);
      return successResponse(res, result, "Banks deleted Successfully");
    } catch (err) {
      next(err);
    }
  },

  // pay money 
  createPaymentRequest: async (req, res, next) => {
    try {
      const payment = await BankService.createPaymentRequest({
        bankId: req.body.bankId,
        commissionHolderId: req.body.commissionHolderId,
        amount: Number(req.body.amount),
      });
      console.log(payment, " payment in controller ");

      return successResponse(res, payment, "Payment request created");
    } catch (err) {
      next(err);
    }
  },

};

export default BankController;
