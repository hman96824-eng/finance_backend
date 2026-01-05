import mongoose from "mongoose";
import Transaction from "./model.js";
import Bank from "../bank/model.js";
import { successResponse } from "../../utils/response.helper.js";
import ApiError from "../../utils/ApiError.js";

export const addTransaction = async (req, res, next) => {
    try {
        const { projectId, clientId, bankId, transactionType, amount, description, transactionDate } = req.body;

        const bank = await Bank.findById(bankId);
        if (!bank) {
            throw ApiError.notFound("Bank account not found");
        }

        const balanceBefore = Number(bank.balance || 0);
        let balanceAfter;

        if (transactionType === "debit") {
            if (balanceBefore < amount) {
                throw ApiError.badRequest("Insufficient balance in the selected bank account");
            }
            balanceAfter = balanceBefore - amount;
        } else if (transactionType === "credit") {
            balanceAfter = balanceBefore + amount;
        } else {
            throw ApiError.badRequest("Invalid transaction type");
        }

        // Use a simpler update to avoid pre-save hooks if they interfere with our manual calculation
        // However, bank model already has a pre-save hook that updates balance from paymentHistory.
        // We should decide: either add to paymentHistory OR update balance manually.
        // Given the requirement "every transaction must be linked to a bank account", 
        // we will follow the Transaction model route and also update the Bank's current balance.

        bank.balance = balanceAfter;

        // Add to bank's internal paymentHistory for legacy compatibility if needed
        bank.paymentHistory.push({
            project: projectId,
            amount: amount,
            type: transactionType,
            note: description,
            date: transactionDate || new Date()
        });

        await bank.save();

        const transaction = await Transaction.create({
            projectId,
            clientId,
            bankId,
            transactionType,
            amount,
            balanceBefore,
            balanceAfter,
            description,
            transactionDate: transactionDate || new Date(),
        });

        return successResponse(res, transaction, "Transaction recorded successfully");
    } catch (error) {
        next(error);
    }
};

export const getAllTransactions = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            projectId,
            bankId,
            clientId,
            type,
            startDate,
            endDate,
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const matchQuery = { isDeleted: false };

        if (projectId) matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
        if (bankId) matchQuery.bankId = new mongoose.Types.ObjectId(bankId);
        if (clientId) matchQuery.clientId = new mongoose.Types.ObjectId(clientId);
        if (type) matchQuery.transactionType = type;

        if (startDate || endDate) {
            matchQuery.transactionDate = {};
            if (startDate) matchQuery.transactionDate.$gte = new Date(startDate);
            if (endDate) matchQuery.transactionDate.$lte = new Date(endDate);
        }

        const pipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "projectInfo",
                },
            },
            { $unwind: { path: "$projectInfo", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "clients",
                    localField: "clientId",
                    foreignField: "_id",
                    as: "clientInfo",
                },
            },
            { $unwind: { path: "$clientInfo", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "banks",
                    localField: "bankId",
                    foreignField: "_id",
                    as: "bankInfo",
                },
            },
            { $unwind: { path: "$bankInfo", preserveNullAndEmptyArrays: true } },
        ];

        // Apply global search across multiple fields
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "projectInfo.projectName": { $regex: search, $options: "i" } },
                        { "clientInfo.clientName": { $regex: search, $options: "i" } },
                        { "bankInfo.bankName": { $regex: search, $options: "i" } },
                        { description: { $regex: search, $options: "i" } },
                    ],
                },
            });
        }

        // Count total matching documents
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Transaction.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Final data pipeline
        pipeline.push(
            { $sort: { transactionDate: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
                $project: {
                    id: "$_id",
                    _id: 1,
                    transactionType: 1,
                    amount: 1,
                    balanceBefore: 1,
                    balanceAfter: 1,
                    description: 1,
                    transactionDate: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    projectId: "$projectInfo",
                    clientId: "$clientInfo",
                    bankId: "$bankInfo",
                },
            }
        );

        const transactions = await Transaction.aggregate(pipeline);

        return successResponse(
            res,
            {
                transactions,
                pagination: {
                    total,
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    pageSize: Number(limit),
                },
            },
            "Transactions fetched successfully"
        );
    } catch (error) {
        next(error);
    }
};

export const deleteTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id);

        if (!transaction || transaction.isDeleted) {
            throw ApiError.notFound("Transaction not found");
        }

        // Reverse the balance impact on the bank
        const bank = await Bank.findById(transaction.bankId);
        if (bank) {
            if (transaction.transactionType === "credit") {
                bank.balance -= transaction.amount;
            } else {
                bank.balance += transaction.amount;
            }
            await bank.save();
        }

        transaction.isDeleted = true;
        await transaction.save();

        return successResponse(res, null, "Transaction deleted successfully");
    } catch (error) {
        next(error);
    }
};

export const bulkDeleteTransactions = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            throw ApiError.badRequest("Invalid transaction IDs");
        }

        const transactions = await Transaction.find({ _id: { $in: ids }, isDeleted: false });

        for (const transaction of transactions) {
            const bank = await Bank.findById(transaction.bankId);
            if (bank) {
                if (transaction.transactionType === "credit") {
                    bank.balance -= transaction.amount;
                } else {
                    bank.balance += transaction.amount;
                }
                await bank.save();
            }
            transaction.isDeleted = true;
            await transaction.save();
        }

        return successResponse(res, null, "Transactions deleted successfully");
    } catch (error) {
        next(error);
    }
};
