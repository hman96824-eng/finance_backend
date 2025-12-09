import mongoose from "mongoose";
import BankModel from "./model.js";
import ProjectModel from "../project/model.js";
import ApiError from "../../utils/ApiError.js";
import repository from "../../utils/repository.js";
import messages from "../../constants/messages.js";
import PaymentSchemaforpay from "./model.js";
import { ProjectCommissionModel } from "../commission/model.js";
import { bankSchema } from "../../validation/validation.js";




const projectRepo = new repository(ProjectModel);
const BankRepo = new repository(BankModel);

class BankService {
  static createBank = async (data, userId) => {
    if (Array.isArray(data.paymentHistory)) {
      for (let i = 0; i < data.paymentHistory.length; i++) {
        const entry = data.paymentHistory[i];
        if (!entry.project)
          throw ApiError.badRequest(`paymentHistory.${i}.project required`);
      }
    }
    const bank = await BankRepo.create({ ...data, createdBy: userId });
    return bank;
  };

  static getAllBanks = async (userId) => {
    const banks = await BankRepo.find({ createdBy: userId })
      .populate("createdBy", "name email _id")
      .sort({ createdAt: -1 });
    console.log('check 1 ');
    return banks;

  };


  static getBankById = async (id, userId) => {
    const bank = await BankRepo.findOne({ _id: id, createdBy: userId }).populate(
      "createdBy",
      "name email _id"
    );
    if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
    return this.formatBankResponse(bank);
  };

  static updateBank = async (id, data, userId) => {
    const bank = await BankRepo.findOne({ _id: id, createdBy: userId });
    if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

    if (Array.isArray(data.paymentHistory)) {
      for (let i = 0; i < data.paymentHistory.length; i++) {
        const entry = data.paymentHistory[i];
        if (!entry.project)
          throw ApiError.badRequest(`paymentHistory.${i}.project required`);
      }
    }

    const updatedBank = await BankRepo.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { ...data },
      { new: true }
    ).populate("createdBy", "name email _id");

    return this.formatBankResponse(updatedBank);
  };

  static getPayments = async (bankId, userId) => {
    const bank = await BankRepo.findOne({ _id: bankId, createdBy: userId });
    if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

    const formattedBank = this.formatBankResponse(bank);

    return {
      bankId: bank._id,
      bankName: bank.bankName,
      paymentHistory: formattedBank.paymentHistory || [],
    };
  };

  static addPayment = async (
    bankId,
    userId,
    { amount, type = "credit", note, project, projectName, clientName }
  ) => {
    const session = await mongoose.startSession();
    try {
      if (!mongoose.Types.ObjectId.isValid(project))
        throw ApiError.badRequest("Invalid project ID");

      const amt = Number(amount);
      if (amt <= 0)
        throw ApiError.badRequest("Payment amount must be greater than zero");

      await session.withTransaction(async () => {
        const bank = await BankModel.findOne({
          _id: bankId,
          createdBy: userId,
        }).session(session);
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

        this.cleanupPaymentHistory(bank);

        const projectDoc = await ProjectModel.findById(project).session(
          session
        );
        if (!projectDoc) throw ApiError.notFound(messages.PROJECT_NOT_FOUND);

        const paymentEntry = {
          project,
          projectName: projectName || "",
          clientName: clientName || "",
          amount: amt,
          type,
          note: note || "",
          date: new Date(),
        };

        bank.paymentHistory.push(paymentEntry);

        if (!projectDoc.bankPayments) projectDoc.bankPayments = [];
        if (!projectDoc.banks) projectDoc.banks = [];

        projectDoc.bankPayments.push({
          bank: bank._id,
          amount: amt,
          type,
          note: note || "",
          date: new Date(),
          bankSnapshot: {
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            accountTitle: bank.accountTitle,
          },
        });

        if (!projectDoc.banks.includes(bank._id))
          projectDoc.banks.push(bank._id);

        const paymentAmt = type === "credit" ? amt : -amt;
        projectDoc.totalPaid = (projectDoc.totalPaid || 0) + paymentAmt;

        if (typeof projectDoc.budget === "number") {
          projectDoc.pendingAmount = Math.max(
            projectDoc.budget - projectDoc.totalPaid,
            0
          );
        }

        await bank.save({ session });
        await projectDoc.save({ session });
      });

      return this.formatBankResponse(
        await BankModel.findById(bankId).populate(
          "createdBy",
          "name email _id"
        )
      );
    } catch (err) {
      throw ApiError.badRequest(err.message || "Failed to add payment");
    } finally {
      await session.endSession();
    }
  };

  static addExpenseToBank = async (bankId, expense) => {
    const bank = await BankModel.findById(bankId);
    if (!bank) throw ApiError.notFound("Bank not found");

    const expenseEntry = {
      project: expense._id.toString(),
      projectName: expense.title,
      clientName: expense.purchaseBy,
      amount: expense.amount,
      type: "debit",
      note: expense.note || "",
      date: expense.date || new Date(),
    };

    bank.paymentHistory.push(expenseEntry);

    await bank.save();

    return this.formatBankResponse(
      await BankModel.findById(bankId).populate(
        "createdBy",
        "name email _id"
      )
    );
  };

  static deleteBank = async (id, userId) => {
    const bank = await BankRepo.findOne({ _id: id, createdBy: userId });
    if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

    await BankRepo.deleteOne({ _id: id, createdBy: userId });
    return bank;
  };

  static deleteManyBanks = async (bankIds, userId) => {
    if (!Array.isArray(bankIds) || bankIds.length === 0) {
      throw ApiError.badRequest(messages.NO_BANKS_SELECTED);
    }

    return await BankRepo.deleteMany({
      _id: { $in: bankIds },
      createdBy: userId,
    });
  };


  //  CREATE PAYMENT REQUEST


  static createPaymentRequest = async (payload) => {
    console.log("Payload:", payload);

    const { bankId, commissionHolderId, amount } = payload;

    if (!bankId || !commissionHolderId || !amount) {
      throw new ApiError("bankId, commissionHolderId and amount are required", 422);
    }

    // 1️⃣ GET BANK
    const bank = await BankModel.findById(bankId);
    if (!bank) throw new ApiError("Bank not found", 404);

    // 2️⃣ GET PROJECT
    const project = await ProjectCommissionModel.findOne({
      "commissionHolders._id": commissionHolderId,
    });

    if (!project) throw new ApiError(404, "Commission holder not found in any project");

    const holder = project.commissionHolders.id(commissionHolderId);
    if (!holder) throw new ApiError(404, "Commission holder not found");

    // 3️⃣ VALIDATION
    const paidAmount = holder.paidAmount || 0;
    const remainingAmount = holder.amountPKR - paidAmount;

    if (amount > remainingAmount) {
      throw new ApiError(400, "Cannot pay more than remaining commission amount");
    }

    if (bank.balance < amount) {
      throw new ApiError(400, "Bank does not have sufficient balance");
    }

    bank.paymentHistory.push({
      commissionHolderId,
      projectId: project._id,
      projectName: project.projectName,
      commissionHolderName: holder.holderName,
      amount,
      type: "debit",
      date: new Date(),
    });

    // 6️⃣ UPDATE HOLDER
    holder.paidAmount = paidAmount + amount;

    // 7️⃣ SAVE BOTH
    await bank.save();
    console.log("🟢 BANK SAVED:", {
      id: bank._id,
      name: bank.name,
      balance: bank.balance,
      updatedAt: bank.updatedAt
    });
    await project.save();

    return {
      bankId: bank._id,
      balance: bank.balance,
      paidAmount: holder.paidAmount,
      message: "Commission payment completed successfully",
    };
  };



}

export default BankService;



