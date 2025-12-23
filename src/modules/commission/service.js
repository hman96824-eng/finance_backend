import { ProjectCommissionModel } from "./model.js";
import ProjectModel from "../project/model.js";
import mongoose from "mongoose";

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const CommissionService = {
  // CREATE COMMISSION
  createCommission: async (payload) => {
    const { projectId, usdRate, holders } = payload;

    if (!projectId || !usdRate) {
      throw new AppError(
        "Project ID and conversion rate (USD → PKR) are required",
        422
      );
    }

    // 🔥 CHECK IF COMMISSION ALREADY EXISTS FOR THIS PROJECT
    const existingCommission = await ProjectCommissionModel.findOne({ projectId });
    if (existingCommission) {
      throw new AppError(
        "Commission for this project already exists. You cannot create another one.",
        409
      );
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) throw new AppError("Project not found", 404);

    const projectAmountUSD = project.budgetUSD || 0;
    const totalAmountPKR = Number((projectAmountUSD * usdRate).toFixed(2));

    const commissionHolders = (holders || []).map((h) => ({
      holderRef: h.holderRef || null,
      holderModel: h.holderModel || null,
      holderName: h.holderName || h.name,   // <—— FIXED
      percentage: h.percentage,
      amountPKR: Number(((totalAmountPKR * h.percentage) / 100).toFixed(2)),
    }));

    return await ProjectCommissionModel.create({
      projectId,
      projectName: project.projectName,
      projectAmountUSD,
      conversionRate: usdRate,
      totalAmountPKR,
      commissionHolders,
      createdBy: payload.createdBy || null,
    });
  },

  // UPDATE COMMISSION
  // updateCommission: async (commissionId, payload) => {
  //   const commission = await ProjectCommissionModel.findById(commissionId);
  //   if (!commission) throw new AppError("Commission not found", 404);

  //   if (payload.projectId) {
  //     const project = await ProjectModel.findById(payload.projectId);
  //     if (!project) throw new AppError("Project not found", 404);

  //     commission.projectId = payload.projectId;
  //     commission.projectName = project.projectName;
  //     commission.projectAmountUSD = project.budgetUSD;
  //   }

  //   if (payload.usdRate) {
  //     commission.conversionRate = payload.usdRate;
  //   }

  //   const totalPKR =
  //     (payload.projectAmountUSD || commission.projectAmountUSD) *
  //     (payload.usdRate || commission.conversionRate);

  //   commission.totalAmountPKR = Number(totalPKR.toFixed(2));

  //   if (payload.holders) {
  //     commission.commissionHolders = payload.holders.map((h) => ({
  //       holderRef: h.holderRef || null,
  //       holderModel: h.holderModel || null,
  //       holderName: h.holderName,
  //       percentage: h.percentage,
  //       amountPKR: Number(
  //         ((commission.totalAmountPKR * h.percentage) / 100).toFixed(2)
  //       ),
  //     }));
  //   }

  //   commission.updatedBy = payload.updatedBy || null;

  //   await commission.save();
  //   return commission;
  // },


  updateCommission: async (commissionId, payload) => {
    const commission = await ProjectCommissionModel.findById(commissionId);
    if (!commission) throw new AppError("Commission not found", 404);

    // -----------------------------------------------------
    // UPDATE PROJECT FIELDS
    // -----------------------------------------------------
    if (payload.projectId) {
      const project = await ProjectModel.findById(payload.projectId);
      if (!project) throw new AppError("Project not found", 404);

      commission.projectId = payload.projectId;
      commission.projectName = project.projectName;
      commission.projectAmountUSD = project.budgetUSD;
    }

    if (payload.usdRate) {
      commission.conversionRate = payload.usdRate;
    }

    // Recalculate total PKR
    const totalPKR =
      (payload.projectAmountUSD || commission.projectAmountUSD) *
      (payload.usdRate || commission.conversionRate);

    commission.totalAmountPKR = Number(totalPKR.toFixed(2));

    // -----------------------------------------------------
    // UPDATE HOLDERS (SMART MERGE LOGIC)
    // -----------------------------------------------------
    if (payload.holders) {
      const updatedHolders = [];

      for (const h of payload.holders) {
        // 1️⃣ If holder has _id → Update existing
        if (h._id) {
          const existing = commission.commissionHolders.id(h._id);
          if (!existing) continue;

          const newAmountPKR = Number(
            ((commission.totalAmountPKR * h.percentage) / 100).toFixed(2)
          );

          updatedHolders.push({
            _id: existing._id,
            holderRef: h.holderRef || existing.holderRef,
            holderModel: h.holderModel || existing.holderModel,
            holderName: h.holderName,
            percentage: h.percentage,
            amountPKR: newAmountPKR,
            paidAmount: existing.paidAmount || 0, // KEEP OLD PAID
          });
        }

        // 2️⃣ NEW HOLDER → Add fresh
        else {
          const newAmountPKR = Number(
            ((commission.totalAmountPKR * h.percentage) / 100).toFixed(2)
          );

          updatedHolders.push({
            holderRef: h.holderRef || null,
            holderModel: h.holderModel || null,
            holderName: h.holderName,
            percentage: h.percentage,
            amountPKR: newAmountPKR,
            paidAmount: 0, // NEW HOLDER HAS 0 PAID
          });
        }
      }

      // Save clean updated list
      commission.commissionHolders = updatedHolders;
    }

    // -----------------------------------------------------
    // UPDATED BY
    // -----------------------------------------------------
    commission.updatedBy = payload.updatedBy || null;

    await commission.save();
    return commission;
  },



  // GET ALL COMMISSIONS
  getAllCommissions: async (page = 1, limit = 10) => {
    const skip = (Number(page) - 1) * Number(limit);

    const commissions = await ProjectCommissionModel.find({})
      .populate("projectId", "projectName projectID budgetUSD budgetPKR")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ProjectCommissionModel.countDocuments({});

    return {
      commissions,
      pagination: {
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        pageSize: Number(limit),
      },
    };
  },

  // GET SINGLE COMMISSION
  getCommissionById: async (commissionId) => {
    const commission = await ProjectCommissionModel.findById(commissionId).populate(
      "projectId",
      "projectName projectID budgetUSD budgetPKR"
    );

    if (!commission) throw new AppError("Commission not found", 404);

    return commission;
  },

  // DELETE COMMISSION(S)
  deleteCommission: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError("Please provide an array of IDs", 400);
    }

    const result = await ProjectCommissionModel.deleteMany({
      _id: { $in: ids },
    });

    return { deleted: result.deletedCount };
  },

  // payments


};

export default CommissionService;
