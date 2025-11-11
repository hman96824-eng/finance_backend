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
      const banks = await BankService.getAllBanks(req.user.id);
      return successResponse(res, banks);
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
      const bank = await BankService.addPayment(
        req.params.id,
        req.user.id,
        req.body
      );
      return successResponse(res, bank);
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
};

export default BankController;
