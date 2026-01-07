
import OtherTransaction from "./model.js";
import Bank from "../bank/model.js";
import ApiError from "../../utils/ApiError.js";

class OtherTransactionService {
    static async createTransaction(data) {
        const { bankId, transactionType, amount, description, transactionDate } = data;

        // Validate required fields
        if (!bankId || bankId === "") {
            throw new ApiError("Bank ID is required", 400);
        }

        if (!transactionType) {
            throw new ApiError("Transaction type is required", 400);
        }

        if (!amount || amount <= 0) {
            throw new ApiError("Amount must be greater than 0", 400);
        }

        const bank = await Bank.findById(bankId);
        if (!bank) throw new ApiError("Bank not found", 404);

        const numericAmount = Number(amount);
        let balanceBefore = Number(bank.balance) || 0;
        let balanceAfter;

        if (transactionType === "debit") {
            if (balanceBefore < numericAmount) {
                throw new ApiError("Insufficient balance in the selected bank account", 400);
            }
            balanceAfter = balanceBefore - numericAmount;
        } else {
            balanceAfter = balanceBefore + numericAmount;
        }

        // Update Bank Balance
        bank.balance = balanceAfter;

        // Add to bank paymentHistory for consistency
        bank.paymentHistory.push({
            amount: numericAmount,
            type: transactionType,
            note: description || "Other Transaction",
            date: transactionDate || new Date(),
        });

        await bank.save();

        // Create Transaction Record
        const transaction = await OtherTransaction.create({
            bankId,
            transactionType,
            amount: numericAmount,
            description,
            transactionDate: transactionDate || new Date(),
        });

        return transaction;
    }

    static async getAllTransactions(page = 1, limit = 10, search = "") {
        const skip = (Number(page) - 1) * Number(limit);
        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const total = await OtherTransaction.countDocuments(query);
        const transactions = await OtherTransaction.find(query)
            .populate("bankId", "bankName accountTitle accountNumber")
            .sort({ transactionDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        return {
            transactions,
            pagination: {
                total,
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                pageSize: Number(limit),
            },
        };
    }

    static async deleteTransaction(id) {
        const transaction = await OtherTransaction.findById(id);
        if (!transaction || transaction.isDeleted) {
            throw new ApiError("Transaction not found", 404);
        }

        const bank = await Bank.findById(transaction.bankId);
        if (bank) {
            // Reverse balance
            if (transaction.transactionType === "credit") {
                bank.balance -= transaction.amount;
            } else {
                bank.balance += transaction.amount;
            }
            await bank.save();
        }

        transaction.isDeleted = true;
        await transaction.save();

        return { message: "Transaction deleted successfully" };
    }

    static async bulkDeleteTransactions(ids) {
        const transactions = await OtherTransaction.find({ _id: { $in: ids }, isDeleted: false });

        for (const transaction of transactions) {
            const bank = await Bank.findById(transaction.bankId);
            if (bank) {
                // Reverse balance
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

        return { message: "Transactions deleted successfully" };
    }
}

export default OtherTransactionService;
