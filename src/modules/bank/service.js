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
  // Format bank document for responses (normalize paymentHistory entries)
  static formatBankResponse = (bank) => {
    if (!bank) return null;
    // if Mongoose document, convert to plain object
    const b = typeof bank.toObject === 'function' ? bank.toObject() : { ...bank };
    const ph = Array.isArray(b.paymentHistory) ? b.paymentHistory.slice() : [];
    b.paymentHistory = ph
      .map((p) => {
        // Normalize project to id string when possible
        let projectId = null;
        if (p && p.project) {
          if (typeof p.project === 'object' && p.project._id) projectId = String(p.project._id);
          else projectId = String(p.project);
        }
        return {
          project: projectId,
          projectName: p.projectName || '',
          clientName: p.clientName || '',
          amount: typeof p.amount === 'number' ? p.amount : Number(p.amount || 0),
          type: p.type || 'credit',
          note: p.note || '',
          date: p.date ? new Date(p.date) : null,
        };
      })
      // sort by date desc
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    return b;
  };

  // Ensure paymentHistory entries are normalized before saving
  static cleanupPaymentHistory = (bank) => {
    if (!bank || !Array.isArray(bank.paymentHistory)) return;
    bank.paymentHistory = bank.paymentHistory.map((p) => {
      // If project is a populated object, keep only id
      if (p && typeof p.project === 'object' && p.project._id) p.project = p.project._id;
      if (!p.date) p.date = new Date();
      if (!p.type) p.type = 'credit';
      p.amount = Number(p.amount || 0);
      return p;
    });
  };
  static createBank = async (data) => {
    if (Array.isArray(data.paymentHistory)) {
      for (let i = 0; i < data.paymentHistory.length; i++) {
        const entry = data.paymentHistory[i];
        if (!entry.project)
          throw ApiError.badRequest(`paymentHistory.${i}.project required`);
      }
    }
    const bank = await BankRepo.create({ ...data });
    return bank;
  };

  static getAllBanks = async (page = 1, limit = 10) => {
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch paginated banks
    const banks = await BankModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination metadata
    const total = await BankModel.countDocuments({});

    return {
      banks,
      pagination: {
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        pageSize: Number(limit),
      },
    };
  };


  static getBankById = async (id) => {
    const bank = await BankRepo.findOne({ _id: id });
    if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
    return this.formatBankResponse(bank);
  };

  static updateBank = async (id, data) => {
    const bank = await BankRepo.findOne({ _id: id });
    if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

    if (Array.isArray(data.paymentHistory)) {
      for (let i = 0; i < data.paymentHistory.length; i++) {
        const entry = data.paymentHistory[i];
        if (!entry.project)
          throw ApiError.badRequest(`paymentHistory.${i}.project required`);
      }
    }

    const updatedBank = await BankRepo.findOneAndUpdate(
      { _id: id },
      { ...data },
      { new: true }
    );

    return this.formatBankResponse(updatedBank);
  };

  static getPayments = async (bankId) => {
    const bank = await BankRepo.findOne({ _id: bankId });
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
        await BankModel.findById(bankId)
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
      await BankModel.findById(bankId)
    );
  };

  static deleteBank = async (id) => {
    const bank = await BankRepo.findOne({ _id: id });
    if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

    await BankRepo.deleteOne({ _id: id });
    return bank;
  };

  static deleteManyBanks = async (bankIds) => {
    if (!Array.isArray(bankIds) || bankIds.length === 0) {
      throw ApiError.badRequest(messages.NO_BANKS_SELECTED);
    }

    return await BankRepo.deleteMany({
      _id: { $in: bankIds },
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



