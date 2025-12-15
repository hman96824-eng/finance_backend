import dotenv from "dotenv";
dotenv.config({ path: '../../../.env' }); // adjust path

import mongoose from "mongoose";
import FinancialMonth from "./model.js";

console.log("MONGO_URI =", process.env.MONGO_URI); // check dotenv

async function seedMonth() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const monthKey = "2025-12";
    const existing = await FinancialMonth.findOne({ monthKey });

    if (!existing) {
      await FinancialMonth.create({ monthKey, status: "OPEN" });
      console.log("Current month created:", monthKey);
    } else {
      console.log("Month already exists:", monthKey);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

seedMonth();
