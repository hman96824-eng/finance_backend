import axios from "axios";
import Project from "./model.js";
import Bank from "../bank/model.js";
import Transaction from "../transaction/model.js";
import ApiError from "../../utils/ApiError.js";
import Repository from "../../utils/repository.js";

const ProRepo = new Repository(Project);
const BankRepo = new Repository(Bank);

// make  afunciton in which set the project id  liek PROJ-0001 check existing ids and set the next id
const generateProjectID = async () => {
  try {
    // Find the project with the highest ID number
    const lastProject = await ProRepo.findOne(
      {},
      { projectID: 1 },
      { sort: { projectID: -1 } }
    );

    let nextNumber = 1;
    if (lastProject && lastProject.projectID) {
      // Extract the number from the last project ID (e.g., "PROJ-0006" -> 6)
      const parts = String(lastProject.projectID).split("-");
      const lastNumber = parseInt(parts[1] || "0", 10) || 0;
      nextNumber = lastNumber + 1;
    }

    return `PROJ-${String(nextNumber).padStart(4, "0")}`;
  } catch (error) {
    throw ApiError.internal("Error generating project ID");
  }
};

// --------- NEW: conversion helper (uses provided API key) ----------
const convertUSDToPKR = async (usdAmount) => {
  try {
    // YOUR API KEY (from the message)
    const API_KEY = "7fb4de64678297771c9d69fa";
    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/USD/PKR`;

    const resp = await axios.get(url);
    const data = resp?.data;
    const rate = data && typeof data.conversion_rate !== "undefined" ? Number(data.conversion_rate) : null;

    if (!rate || Number.isNaN(rate)) {
      // if rate is not available, return 0 (safe fallback)
      return 0;
    }

    return usdAmount * rate;
  } catch (err) {
    // Do not throw here to avoid breaking the flow — return 0 as a safe fallback.
    // Caller can decide what to do if conversion fails.
    // Optionally you can log the error in your logging system.
    return 0;
  }
};
// --------------------------------------------------------------------

const ProService = {
  addProject: async (data, userId) => {
    try {
      const projectID = await generateProjectID();

      const {
        projectName,
        projectType,
        projectDetails,
        platform,
        projectManager,
        teamMembers,
        startDate,
        endDate,
        status,
        budget = 0,
        payments = [] // payments: optional initial payments that may include bank info
      } = data || {};

      // ------ NEW: handle budgetUSD (user-entered USD) safely -------
      // If user provided budgetUSD in the request prefer that (converted to PKR).
      // Otherwise keep existing behavior where `budget` is treated as PKR.
      const providedBudgetUSD = typeof data?.budgetUSD !== "undefined" ? Number(data.budgetUSD) : undefined;

      // safeBudget will ultimately be PKR amount used by the rest of your logic
      let safeBudget = typeof budget === "number" ? budget : Number(budget) || 0;
      let budgetUSD = 0;
      let budgetPKR = 0;

      if (typeof providedBudgetUSD !== "undefined" && !Number.isNaN(providedBudgetUSD) && providedBudgetUSD > 0) {
        budgetUSD = providedBudgetUSD;
        // convert to PKR via API helper
        const converted = await convertUSDToPKR(budgetUSD);
        // if conversion fails converted = 0, we fallback to 0 to not crash. You can decide to change behavior.
        budgetPKR = Number(converted) || 0;
        // set safeBudget (PKR) for the rest of the code
        safeBudget = budgetPKR;
      } else {
        // No budgetUSD provided — keep existing budget as PKR (safeBudget already set)
        budgetUSD = 0;
        budgetPKR = safeBudget;
      }
      // ---------------------------------------------------------------

      const safePayments = Array.isArray(payments) ? payments : [];
      const safeBudgetNum = typeof safeBudget === "number" ? safeBudget : Number(safeBudget) || 0;

      // Calculate totals based on initial payments if they have amounts
      const totalPaid = safePayments.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
      const pendingAmount = Math.max(safeBudgetNum - totalPaid, 0);

      // Create project first (without banks/payments)
      const project = await Project.create({
        projectName,
        projectID,
        projectType,
        projectDetails,
        platform,
        projectManager,
        teamMembers,
        startDate,
        endDate,
        status,
        // Save both USD and PKR, and keep the existing `budget` field as PKR for backward compatibility
        budgetUSD,
        budgetPKR,
        budget: safeBudgetNum,
        totalPaid,
        pendingAmount,
        banks: [],
        bankPayments: []
      });

      // 🏦 Process each initial payment, create or update banks, and add bankPayments entry
      for (const payment of safePayments) {
        const { bankName, accountTitle, accountNumber, ibanNumber, amount, note, bankId } = payment || {};

        let bank = null;

        // 🔍 Priority 1: Direct Bank ID
        if (bankId) {
          bank = await Bank.findById(bankId);
        }

        // 🔍 Priority 2: Account Number / IBAN
        if (!bank) {
          const findQuery = {};
          if (accountNumber) findQuery.accountNumber = accountNumber?.trim();
          if (ibanNumber) findQuery.ibanNumber = ibanNumber?.trim().toUpperCase();

          if (Object.keys(findQuery).length > 0) {
            bank = await Bank.findOne(findQuery);
          }
        }

        // 🏦 Create new bank if still not found (Legacy compatibility)
        if (!bank && (bankName || accountTitle)) {
          bank = await Bank.create({
            bankName: bankName || "Unknown Bank",
            accountTitle: accountTitle || "Unknown Account",
            accountNumber: accountNumber || `AUTO-${Date.now()}`,
            ibanNumber: ibanNumber || "",
            balance: 0,
            paymentHistory: [],
          });
        }

        if (!bank) continue;

        const amt = Number(amount) || 0;
        if (amt > 0) {
          const balanceBefore = Number(bank.balance) || 0;
          const balanceAfter = balanceBefore + amt;

          // 📝 Create Transaction Record
          await Transaction.create({
            projectId: project._id,
            clientId: project.clientId,
            bankId: bank._id,
            transactionType: "credit",
            amount: amt,
            balanceBefore,
            balanceAfter,
            description: note || `Initial project payment for ${projectName}`,
            transactionDate: new Date(),
          });

          // 🏦 Update Bank balance and history
          bank.balance = balanceAfter;
          bank.paymentHistory.push({
            project: project._id,
            amount: amt,
            type: "credit",
            note: note || "Initial project payment",
            date: new Date()
          });
          await bank.save();

          // 🔗 add bankPayments entry on project
          project.bankPayments.push({
            bank: bank._id,
            amount: amt,
            type: "credit",
            note: note || "Initial project payment",
            date: new Date(),
            bankSnapshot: {
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              accountTitle: bank.accountTitle
            }
          });
        }

        if (!project.banks.some((b) => b.toString() === bank._id.toString())) {
          project.banks.push(bank._id);
        }
      }

      await project.save();

      // Populate banks but filter each bank’s paymentHistory for this project only
      const populatedProject = await Project.findById(project._id).populate("banks").lean();

      populatedProject.banks = (Array.isArray(populatedProject.banks) ? populatedProject.banks : []).map((b) => ({
        ...b,
        paymentHistory: (Array.isArray(b.paymentHistory) ? b.paymentHistory : []).filter((tx) =>
          tx.project && tx.project.toString() === populatedProject._id.toString()
        )
      }));

      return populatedProject;
    } catch (error) {
      throw ApiError.badRequest(error?.message || "Failed to add project");
    }
  },

  getProjects: async (page = 1, limit = 10, search = "") => {
    try {
      const skip = (Number(page) - 1) * Number(limit);

      const query = {
        status: { $in: ["Pending", "Done"] },
        isDeleted: { $ne: true },
      };

      if (search) {
        query.$or = [
          { projectName: { $regex: search, $options: "i" } },
          { platform: { $regex: search, $options: "i" } },
          { projectID: { $regex: search, $options: "i" } }
        ];
      }

      const projects = await Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await Project.countDocuments(query);

      // To avoid N+1, load all banks referenced by these projects once
      const allBankIds = projects.flatMap(p => Array.isArray(p.banks) ? p.banks : (p.banks ? [p.banks] : []));
      const uniqueBankIds = [...new Set(allBankIds.map(String))];
      const banksById = {};

      if (uniqueBankIds.length > 0) {
        const banks = await Bank.find({ _id: { $in: uniqueBankIds } }).lean();
        for (const b of banks) banksById[b._id.toString()] = b;
      }

      const results = await Promise.all(projects.map(async (proj) => {
        const banksArray = Array.isArray(proj.banks) ? proj.banks : proj.banks ? [proj.banks] : [];

        const processedBanks = banksArray
          .map((bId) => {
            const b = banksById[String(bId)];
            if (!b) return null;
            return {
              ...b,
              paymentHistory: (Array.isArray(b.paymentHistory) ? b.paymentHistory : []).filter(
                (tx) => tx && tx.project && tx.project.toString() === proj._id.toString()
              )
            };
          })
          .filter(Boolean);

        // Calculate total paid from processedBanks
        const totalPaid = processedBanks.reduce((sum, bank) => {
          return sum + (bank.paymentHistory || []).reduce((bankSum, payment) => {
            const amount = Number(payment.amount) || 0;
            return bankSum + (payment.type === 'credit' ? amount : -amount);
          }, 0);
        }, 0);

        const budget = Number(proj.budget || proj.budgetPKR || 0);
        const pendingAmount = Math.max(budget - totalPaid, 0);

        // Persist totals back to DB (keeps DB consistent with bank payments)
        await Project.findByIdAndUpdate(proj._id, {
          budget,
          totalPaid,
          pendingAmount
        }, { new: true });

        return {
          ...proj,
          banks: processedBanks,
          totalPaid,
          pendingAmount
        };
      }));

      return {
        projects: results,
        pagination: {
          total,
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          pageSize: Number(limit),
        },
      };
    } catch (error) {
      throw ApiError.badRequest(error?.message || "Failed to fetch projects");
    }
  },

  getProjectById: async (id) => {
    try {
      const project = await Project.findOne({
        _id: id,
        status: { $in: ["Pending", "Done"] },
        isDeleted: { $ne: true }
      }).lean();

      if (!project) {
        throw ApiError.notFound("Project not found");
      }

      // Load banks associated with the project
      const banks = await Bank.find({ _id: { $in: project.banks || [] } }).lean();

      const processedBanks = banks.map(bank => ({
        ...bank,
        paymentHistory: (bank.paymentHistory || []).filter(
          tx => tx && tx.project && tx.project.toString() === id.toString()
        )
      }));

      // Calculate total paid from processed banks
      const totalPaid = processedBanks.reduce((sum, bank) => {
        return sum + (bank.paymentHistory || []).reduce((bankSum, payment) => {
          const amount = Number(payment.amount) || 0;
          return bankSum + (payment.type === 'credit' ? amount : -amount);
        }, 0);
      }, 0);

      const budget = Number(project.budget || project.budgetPKR || 0);
      const pendingAmount = Math.max(budget - totalPaid, 0);

      // Persist totals back to DB
      await Project.findByIdAndUpdate(id, {
        budget,
        totalPaid,
        pendingAmount
      }, { new: true });

      return {
        ...project,
        banks: processedBanks,
        totalPaid,
        pendingAmount
      };

    } catch (error) {
      throw ApiError.badRequest(error?.message || "Failed to fetch project");
    }
  },

  updateProject: async (projectId, data) => {
    try {
      const existingProject = await Project.findById(projectId);
      if (!existingProject) throw new Error("Project not found");

      const {
        projectName,
        projectDetails,
        platform,
        projectManager,
        teamMembers,
        startDate,
        endDate,
        status,
        budget,
        payments, // optional: array of new or updated payments
        overrideReason,
      } = data;

      // 🧩 1️⃣ Update basic project fields
      if (projectName) existingProject.projectName = projectName;
      if (projectDetails) existingProject.projectDetails = projectDetails;
      if (platform) existingProject.platform = platform;
      if (projectManager) existingProject.projectManager = projectManager;
      if (teamMembers) existingProject.teamMembers = teamMembers;
      if (startDate) existingProject.startDate = startDate;
      if (endDate) existingProject.endDate = endDate;
      if (status) existingProject.status = status;
      if (overrideReason) existingProject.overrideReason = overrideReason;

      // 🧩 Align budget logic with addProject
      const providedBudgetUSD = typeof data?.budgetUSD !== "undefined" ? Number(data.budgetUSD) : undefined;

      if (typeof providedBudgetUSD !== "undefined" && !Number.isNaN(providedBudgetUSD) && providedBudgetUSD > 0) {
        existingProject.budgetUSD = providedBudgetUSD;
        const converted = await convertUSDToPKR(providedBudgetUSD);
        existingProject.budgetPKR = Number(converted) || 0;
        existingProject.budget = existingProject.budgetPKR;
      } else if (typeof budget !== "undefined") {
        const safeBudget = Number(budget) || 0;
        existingProject.budget = safeBudget;
        existingProject.budgetPKR = safeBudget;
        // If budget is provided as PKR, budgetUSD is set to whatever is passed or 0
        existingProject.budgetUSD = data.budgetUSD || 0;
      }

      // 🏦 2️⃣ Process banks (if provided)
      if (Array.isArray(data.banks)) {
        existingProject.banks = data.banks;
      }

      // 💵 3️⃣ Recalculate totals
      const banks = await Bank.find({ _id: { $in: existingProject.banks } });
      const totalPaid = banks.reduce((sum, bank) => {
        const projectPayments = (bank.paymentHistory || []).filter(
          (tx) => tx && tx.project && tx.project.toString() === projectId.toString()
        );
        return sum + projectPayments.reduce((a, tx) => a + (Number(tx.amount) || 0), 0);
      }, 0);

      existingProject.totalPaid = totalPaid;
      existingProject.pendingAmount = existingProject.budgetUSD - totalPaid;

      // 💾 4️⃣ Save updated project
      await existingProject.save();

      // 🧩 5️⃣ Populate banks (only show relevant payments per project)
      const populated = await Project.findById(existingProject._id)
        .populate("banks")
        .lean();

      populated.banks = populated.banks.map((b) => ({
        ...b,
        paymentHistory: (b.paymentHistory || []).filter(
          (tx) => tx.project?.toString() === populated._id.toString()
        ),
      }));

      return populated;
    } catch (error) {
      throw ApiError.badRequest(error.message);
    }
  },

  deleteProjectSoft: async (id) => {
    try {
      const project = await ProRepo.findById(id);
      if (!project) throw ApiError.notFound("Project not found");

      const updated = await ProRepo.findByIdAndUpdate(
        id,
        { status: "Deleted" },
        { new: true }
      );
      return updated;
    } catch (error) {
      throw ApiError.badRequest(
        error?.message || "Failed to soft delete project"
      );
    }
  },

  softDeleteManyProjects: async (projectIds) => {
    try {
      const response = await ProRepo.updateMany(
        { _id: { $in: projectIds } },
        { $set: { status: "Deleted" } }
      );
      const updatedDocs = await ProRepo.find({ _id: { $in: projectIds } });
      return updatedDocs;
    } catch (error) {
      throw ApiError.badRequest(
        error?.message || "Failed to soft delete projects"
      );
    }
  },

  getDeletedProjects: async (page = 1, limit = 10, search) => {
    try {
      const skip = (Number(page) - 1) * Number(limit);
      const query = { status: "Deleted" };

      if (search) {
        query.$or = [
          { projectName: { $regex: search, $options: "i" } },
          { platform: { $regex: search, $options: "i" } },
          { projectManager: { $regex: search, $options: "i" } },
        ];
      }

      const deletedProjects = await ProRepo.find(query)
        .populate("banks")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await ProRepo.count(query);

      const projects = (Array.isArray(deletedProjects) ? deletedProjects : []).map(
        (proj) => {
          proj.banks = (Array.isArray(proj.banks) ? proj.banks : []).map(
            (b) => ({
              ...b,
              paymentHistory: (Array.isArray(b.paymentHistory)
                ? b.paymentHistory
                : []
              ).filter(
                (tx) =>
                  tx.project && tx.project.toString() === proj._id.toString()
              ),
            })
          );
          return proj;
        }
      );

      return {
        projects,
        pagination: {
          total,
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          pageSize: Number(limit),
        },
      };
    } catch (error) {
      throw ApiError.badRequest(
        error?.message || "Failed to fetch deleted projects"
      );
    }
  },

  deleteProjectPermanent: async (id) => {
    try {
      const project = await ProRepo.findById(id);
      if (!project) throw ApiError.notFound("Project not found");

      if (Array.isArray(project.banks)) {
        await BankRepo.deleteMany({ _id: { $in: project.banks } });
      }
      await ProRepo.findByIdAndDelete(id);

      return { success: true };
    } catch (error) {
      throw ApiError.badRequest(
        error?.message || "Failed to permanently delete project"
      );
    }
  },

  deleteAllDeletedProjectsPermanent: async (projectIDs) => {
    try {
      const deletedProjects = await ProRepo.find({ _id: { $in: projectIDs } });
      const bankIds = (Array.isArray(deletedProjects) ? deletedProjects : [])
        .flatMap((p) =>
          Array.isArray(p.banks) ? p.banks : p.banks ? [p.banks] : []
        )
        .filter(Boolean);

      if (bankIds.length > 0) {
        await BankRepo.deleteMany({ _id: { $in: bankIds } });
      }

      await ProRepo.deleteMany({ _id: { $in: projectIDs } });
      return { success: true };
    } catch (error) {
      throw ApiError.badRequest(
        error?.message || "Failed to permanently delete projects"
      );
    }
  },
};

export default ProService;
