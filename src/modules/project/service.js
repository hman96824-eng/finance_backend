// services.js
import Project from "./model.js";
import Bank from "../bank/model.js";
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

const ProService = {
  addProject: async (data) => {
    try {
      const projectID = await generateProjectID();

      const {
        projectName,
        projectType,
        projectDetails,
        clientName,
        projectManager,
        teamMembers,
        startDate,
        endDate,
        status,
        budget = 0,
        payments = [], // ensure default
      } = data || {};

      // Defensive guards
      const safePayments = Array.isArray(payments) ? payments : [];
      const safeBudget =
        typeof budget === "number" ? budget : Number(budget) || 0;

      // 💰 1️⃣ Calculate totals
      const totalPaid = safePayments.reduce(
        (sum, p) => sum + (Number(p?.amount) || 0),
        0
      );
      const pendingAmount = Math.max(safeBudget - totalPaid, 0);

      // 📁 2️⃣ Create project first (without banks)
      const project = await Project.create({
        projectName,
        projectID,
        projectType,
        projectDetails,
        clientName,
        projectManager,
        teamMembers,
        startDate,
        endDate,
        status,
        budget: safeBudget,
        totalPaid,
        pendingAmount,
        banks: [],
      });

      // 🏦 3️⃣ Process each payment and update or create banks
      for (const payment of safePayments) {
        const { bankName, accountTitle, accountNumber, ibanNumber, amount } =
          payment || {};

        const normalizedBank = {
          bankName: bankName ? String(bankName).trim() : undefined,
          accountTitle: accountTitle ? String(accountTitle).trim() : undefined,
          accountNumber: accountNumber
            ? String(accountNumber).trim()
            : undefined,
          ibanNumber: ibanNumber
            ? String(ibanNumber).trim().toUpperCase()
            : undefined,
        };

        // Require accountNumber or ibanNumber to match/create bank
        const findQuery = {};
        if (normalizedBank.accountNumber)
          findQuery.accountNumber = normalizedBank.accountNumber;
        if (normalizedBank.ibanNumber)
          findQuery.ibanNumber = normalizedBank.ibanNumber;

        let bank = null;
        if (Object.keys(findQuery).length > 0) {
          bank = await Bank.findOne(findQuery);
        }

        if (!bank) {
          bank = await Bank.create({
            bankName: normalizedBank.bankName || "unknown",
            accountTitle: normalizedBank.accountTitle || "",
            accountNumber: normalizedBank.accountNumber || "",
            ibanNumber: normalizedBank.ibanNumber || "",
            totalBankBalance: 0,
            paymentHistory: [],
          });
        }

        // Ensure paymentHistory exists before pushing
        bank.paymentHistory = Array.isArray(bank.paymentHistory)
          ? bank.paymentHistory
          : [];

        // Add payment history for this project in that bank
        const amt = Number(amount) || 0;
        if (amt > 0) {
          bank.paymentHistory.push({
            project: project._id,
            amount: amt,
            type: "credit",
            note: "Initial project payment",
          });
          // update bank totalBankBalance if model expects that
          bank.totalBankBalance = (Number(bank.totalBankBalance) || 0) + amt;
          await bank.save();
        }

        // Attach this bank to the project if not already added
        if (!project.banks.some((b) => b.toString() === bank._id.toString())) {
          project.banks.push(bank._id);
        }
      }

      await project.save();

      // 🧩 4️⃣ Populate with filtered bank data
      const populatedProject = await Project.findById(project._id)
        .populate("banks")
        .lean();

      // Filter each bank’s payment history for this project only (guarded)
      populatedProject.banks = (
        Array.isArray(populatedProject.banks) ? populatedProject.banks : []
      ).map((b) => ({
        ...b,
        paymentHistory: (Array.isArray(b.paymentHistory)
          ? b.paymentHistory
          : []
        ).filter(
          (tx) =>
            tx.project &&
            tx.project.toString() === populatedProject._id.toString()
        ),
      }));

      return populatedProject;
    } catch (error) {
      throw ApiError.badRequest(error?.message || "Failed to add project");
    }
  },

  getProjects: async () => {
    try {
      let projects = await Project.find({
        status: { $in: ["Pending", "Completed"] },
        isDeleted: { $ne: true },
      })
        .populate("banks")
        .sort({ createdAt: -1 })
        .lean();

      // ensure array
      if (!Array.isArray(projects)) projects = projects ? [projects] : [];

      const filteredProjects = projects.map((proj) => {
        const banksArray = Array.isArray(proj.banks)
          ? proj.banks
          : proj.banks
          ? [proj.banks]
          : [];
        proj.banks = banksArray.map((b) => ({
          ...b,
          paymentHistory: (Array.isArray(b.paymentHistory)
            ? b.paymentHistory
            : []
          ).filter(
            (tx) => tx.project && tx.project.toString() === proj._id.toString()
          ),
        }));
        return proj;
      });

      return filteredProjects;
    } catch (error) {
      throw ApiError.badRequest(error?.message || "Failed to fetch projects");
    }
  },

  getProjects: async () => {
    try {
      const projects = await Project.find({
        status: { $in: ["Pending", "Completed"] },
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .lean();

      const allBanks = await Bank.find().lean();

      const result = projects.map((proj) => {
        const banksForProject = allBanks
          .map((bank) => {
            const payments = (bank.paymentHistory || []).filter(
              (tx) =>
                tx.project && tx.project.toString() === proj._id.toString()
            );

            if (payments.length > 0) {
              return { ...bank, paymentHistory: payments };
            }
            return null;
          })
          .filter(Boolean);

        return { ...proj, banks: banksForProject };
      });

      return result;
    } catch (error) {
      throw ApiError.badRequest(error?.message || "Failed to fetch projects");
    }
  },

  updateProject: async (projectId, data) => {
    try {
      const existingProject = await Project.findById(projectId);
      if (!existingProject) throw new Error("Project not found");

      const {
        projectName,
        projectDetails,
        clientName,
        projectManager,
        teamMembers,
        startDate,
        endDate,
        status,
        budget,
        payments, // optional: array of new or updated payments
      } = data;

      // 🧩 1️⃣ Update basic project fields
      if (projectName) existingProject.projectName = projectName;
      if (projectDetails) existingProject.projectDetails = projectDetails;
      if (clientName) existingProject.clientName = clientName;
      if (projectManager) existingProject.projectManager = projectManager;
      if (teamMembers) existingProject.teamMembers = teamMembers;
      if (startDate) existingProject.startDate = startDate;
      if (endDate) existingProject.endDate = endDate;
      if (status) existingProject.status = status;
      if (budget) existingProject.budget = budget;

      // 🏦 2️⃣ Process new or updated payments (if provided)
      if (Array.isArray(payments) && payments.length > 0) {
        for (const payment of payments) {
          const { bankName, accountTitle, accountNumber, ibanNumber, amount } =
            payment;
          if (!amount || amount <= 0) continue;

          const normalizedBank = {
            bankName: bankName?.trim().toLowerCase(),
            accountTitle: accountTitle?.trim().toLowerCase(),
            accountNumber: accountNumber?.trim(),
            ibanNumber: ibanNumber?.trim().toUpperCase(),
          };

          // 🔍 Find existing bank by accountNumber + IBAN
          let bank = await Bank.findOne({
            accountNumber: normalizedBank.accountNumber,
            ibanNumber: normalizedBank.ibanNumber,
          });

          // 🏦 Create new bank if not found
          if (!bank) {
            bank = await Bank.create({
              ...normalizedBank,
              totalBankBalance: 0,
              paymentHistory: [],
            });
          }

          // 💰 Add this new payment
          bank.paymentHistory.push({
            project: projectId,
            amount,
            type: "credit",
            note: "Updated project payment",
          });
          await bank.save();

          // 🔗 Link this bank to the project if not already linked
          if (!existingProject.banks.includes(bank._id)) {
            existingProject.banks.push(bank._id);
          }
        }
      }

      // 💵 3️⃣ Recalculate totals
      const banks = await Bank.find({ _id: { $in: existingProject.banks } });
      const totalPaid = banks.reduce((sum, bank) => {
        const projectPayments = bank.paymentHistory.filter(
          (tx) => tx.project.toString() === projectId.toString()
        );
        return sum + projectPayments.reduce((a, tx) => a + tx.amount, 0);
      }, 0);

      existingProject.totalPaid = totalPaid;
      existingProject.pendingAmount = existingProject.budget - totalPaid;

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

  getDeletedProjects: async () => {
    try {
      const deletedProjects = await ProRepo.find({ status: "Deleted" })
        .populate("banks")
        .sort({ updatedAt: -1 })
        .lean();
      // filter paymentHistory per bank
      return (Array.isArray(deletedProjects) ? deletedProjects : []).map(
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
