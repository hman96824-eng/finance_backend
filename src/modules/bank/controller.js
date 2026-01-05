import BankService from "./service.js";
import ApiError from "../../utils/ApiError.js";
import { successResponse } from "../../utils/response.helper.js";

const BankController = {
  createBank: async (req, res, next) => {
    try {
      const bank = await BankService.createBank(req.body);
      return successResponse(res, bank, "Bank created Successfully");
    } catch (err) {
      next(err);
    }
  },
  getAllBanks: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const data = await BankService.getAllBanks(page, limit, search);
      return successResponse(res, data, "Banks fetched Successfully");
    } catch (err) {
      next(err);
    }
  },
  getBankById: async (req, res, next) => {
    try {
      const bank = await BankService.getBankById(req.params.id);
      return successResponse(res, bank);
    } catch (err) {
      next(err);
    }
  },
  updateBank: async (req, res, next) => {
    try {
      const bank = await BankService.updateBank(
        req.params.id,
        req.body
      );
      return successResponse(res, bank);
    } catch (err) {
      next(err);
    }
  },
  deleteBank: async (req, res, next) => {
    try {
      const bank = await BankService.deleteBank(req.params.id);

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
        req.params.id
      );
      return successResponse(res, payments);
    } catch (err) {
      next(err);
    }
  },
  deleteManyBanks: async (req, res, next) => {
    try {
      const bankIds = req.body;
      const result = await BankService.deleteManyBanks(bankIds);
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
  getDashboardStats: async (req, res, next) => {
    try {
      const stats = await BankService.getBankDashboardStats();
      return successResponse(res, stats, "Dashboard stats fetched successfully");
    } catch (err) {
      next(err);
    }
  },

};

export default BankController;
