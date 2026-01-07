
import OtherTransactionService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const OtherTransactionController = {
    createTransaction: async (req, res, next) => {
        try {
            const transaction = await OtherTransactionService.createTransaction(req.body);
            return successResponse(res, transaction, "Transaction created successfully");
        } catch (error) {
            next(error);
        }
    },

    getAllTransactions: async (req, res, next) => {
        try {
            const { page, limit, search } = req.query;
            const data = await OtherTransactionService.getAllTransactions(page, limit, search);
            return successResponse(res, data, "Transactions fetched successfully");
        } catch (error) {
            next(error);
        }
    },

    deleteTransaction: async (req, res, next) => {
        try {
            const result = await OtherTransactionService.deleteTransaction(req.params.id);
            return successResponse(res, result, result.message);
        } catch (error) {
            next(error);
        }
    },

    bulkDeleteTransactions: async (req, res, next) => {
        try {
            const result = await OtherTransactionService.bulkDeleteTransactions(req.body.ids);
            return successResponse(res, result, result.message);
        } catch (error) {
            next(error);
        }
    },
};

export default OtherTransactionController;
