import mongoose from "mongoose";
import BankModel from "./model.js";
import ProjectModel from "../project/model.js";
import ApiError from "../../utils/ApiError.js";
import repository from "../../utils/repository.js";
import messages from "../../constants/messages.js";

const projectRepo = new repository(ProjectModel);
const BankRepo = new repository(BankModel);

class BankService {
  static createBank = async (data, userId) => {
    if (Array.isArray(data.paymentHistory)) {
      for (let i = 0; i < data.paymentHistory.length; i++) {
        const entry = data.paymentHistory[i];
        if (!entry.project) throw ApiError.badRequest(`paymentHistory.${i}.project required`);
      }
    }
    const bank = await BankRepo.create({ ...data, createdBy: userId });
    return this.formatBankResponse(bank);
  };

  static getAllBanks = async (userId) => {
    const banks = await BankRepo.find({ createdBy: userId })
      .populate("createdBy", "name email _id")
      .sort({ createdAt: -1 });
    return banks.map(this.formatBankResponse);
  };

  static getBankById = async (id, userId) => {
    const bank = await BankRepo.findOne({ _id: id, createdBy: userId })
      .populate("createdBy", "name email _id");
    if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);
    return this.formatBankResponse(bank);
  };

  static addPayment = async (bankId, userId, { amount, type = "credit", note, project, projectName, clientName }) => {
    const session = await mongoose.startSession();
    try {
      if (!mongoose.Types.ObjectId.isValid(project)) throw ApiError.badRequest("Invalid project ID");
      const amt = Number(amount);
      if (amt <= 0) throw ApiError.badRequest("Payment amount must be greater than zero");

      await session.withTransaction(async () => {
        const bank = await BankModel.findOne({ _id: bankId, createdBy: userId }).session(session);
        if (!bank) throw ApiError.notFound(messages.BANK_NOT_FOUND);

        // Clean up old payment history format before adding new payment
        this.cleanupPaymentHistory(bank);

        const projectDoc = await ProjectModel.findById(project).session(session);
        if (!projectDoc) throw ApiError.notFound(messages.PROJECT_NOT_FOUND);

        const paymentEntry = {
          project: project,
          projectName: projectName || "",
          clientName: clientName || "",
          amount: amt,
          type,
          note: note || "",
          date: new Date()
        };
        bank.paymentHistory.push(paymentEntry);

        // Update project snapshot
        if (!projectDoc.bankPayments) projectDoc.bankPayments = [];
        if (!projectDoc.banks) projectDoc.banks = [];
        projectDoc.bankPayments.push({
          bank: bank._id,
          amount: amt,
          type,
          note: note || "",
          date: new Date(),
          bankSnapshot: { bankName: bank.bankName, accountNumber: bank.accountNumber, accountTitle: bank.accountTitle },
        });
        if (!projectDoc.banks.includes(bank._id)) projectDoc.banks.push(bank._id);

        const paymentAmt = type === "credit" ? amt : -amt;
        projectDoc.totalPaid = (projectDoc.totalPaid || 0) + paymentAmt;
        if (typeof projectDoc.budget === "number") projectDoc.pendingAmount = Math.max(projectDoc.budget - projectDoc.totalPaid, 0);

        await bank.save({ session });
        await projectDoc.save({ session });
      });

      return this.formatBankResponse(
        await BankModel.findById(bankId)
          .populate("createdBy", "name email _id")
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
      project: expense._id.toString(), // Store asset ID as project
      projectName: expense.title, // Asset title as project name
      clientName: expense.purchaseBy, // purchaseBy as client name
      amount: expense.amount,
      type: "debit",
      note: expense.note || "",
      date: expense.date || new Date(),
    };

    bank.paymentHistory.push(expenseEntry);
    // Don't update balance here - it's handled by the pre-save hook

    await bank.save();

    return this.formatBankResponse(
      await BankModel.findById(bankId)
        .populate("createdBy", "name email _id")
    );
  };

  static formatBankResponse = (bank) => {
    if (!bank) return null;
    const bankObj = bank.toObject ? bank.toObject() : bank;

    // Get paymentHistory as is (maintains insertion order)
    let allHistory = Array.isArray(bankObj.paymentHistory) ? [...bankObj.paymentHistory] : [];

    // If old expenseHistory exists, convert to new format and append
    if (Array.isArray(bankObj.expenseHistory) && bankObj.expenseHistory.length > 0) {
      const convertedExpenses = bankObj.expenseHistory.map((expense) => ({
        project: expense.expenseId || expense.assetId, // Asset ID as project
        projectName: expense.title, // Asset title as project name  
        clientName: expense.purchaseBy, // purchaseBy as client name
        amount: expense.amount,
        type: expense.type || "debit",
        note: expense.note || "",
        date: expense.date,
      }));
      allHistory = [...allHistory, ...convertedExpenses];
    }

    const response = {
      ...bankObj,
      openingDate: bankObj.openingDate?.toISOString().split("T")[0] || null,
      createdAt: bankObj.createdAt?.toISOString().split("T")[0] || null,
      updatedAt: bankObj.updatedAt?.toISOString().split("T")[0] || null,
      paymentHistory: allHistory.map((payment) => ({
        ...payment,
        date: payment.date ? new Date(payment.date).toISOString().split("T")[0] : null,
      })),
    };

    // Remove expenseHistory from response
    delete response.expenseHistory;

    return response;
  };

  // Clean up old payment history format to new format
  static cleanupPaymentHistory = (bank) => {
    if (!bank.paymentHistory || !Array.isArray(bank.paymentHistory)) return;

    bank.paymentHistory = bank.paymentHistory.map((payment) => {
      // If project is an object (old format), convert to new format
      if (payment.project && typeof payment.project === 'object' && payment.project.assetId) {
        return {
          ...payment,
          project: payment.project.assetId.toString(), // Convert to string ID
          projectName: payment.project.assetName || payment.projectName || "",
          clientName: payment.project.purchaseBy || payment.clientName || "",
        };
      }
      // If project is already a string, keep as is
      return payment;
    });
  };
}

export default BankService;
