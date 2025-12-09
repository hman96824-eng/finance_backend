import mongoose from "mongoose";
import { number } from "zod";

const CommissionHolderSchema = new mongoose.Schema({
  holderRef: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "commissionHolders.holderModel",
    default: null,
  },
  paidAmount:{
    type:number,
    default:null
  },
  holderModel: {
    type: String,
    enum: ["User", "Employee", null],
    default: null,
  },

  holderName: {
    type: String,
    required: function () {
      return !this.holderRef;
    },
  },

  percentage: { type: Number, required: true },

  amountPKR: { type: Number, required: true },
});

const ProjectCommissionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    projectName: { type: String, required: true },

    projectAmountUSD: { type: Number, required: true },

    conversionRate: { type: Number, required: true },

    totalAmountPKR: { type: Number, required: true },

    commissionHolders: [CommissionHolderSchema],
  },
  { timestamps: true }
);

export const ProjectCommissionModel = mongoose.model(
  "ProjectCommission",
  ProjectCommissionSchema
);
