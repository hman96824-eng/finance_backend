import mongoose from "mongoose";
import SalaryModel from "./src/modules/expenses/salary/model.js";
import BankModel from "./src/modules/bank/model.js";
import AssetExpenseModel from "./src/modules/expenses/asset/model.js";
import * as dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

console.log("\n=== SALARY DATA ===");
const salaries = await SalaryModel.find({}, {  salaries: 1, employeeName: 1, isDeleted: 1 }).limit(2);
console.log("Sample Salaries from DB:", JSON.stringify(salaries, null, 2));

console.log("\n=== BANK DATA ===");
const banks = await BankModel.find({ status: 'Active' }, { balance: 1, bankName: 1, status: 1 });
console.log("Banks with balances:", JSON.stringify(banks, null, 2));

console.log("\n=== ASSET DATA ===");
const assets = await AssetExpenseModel.find({}, { amount: 1, title: 1, purchaseDate: 1, isDeleted: 1 }).limit(2);
console.log("Sample Assets:", JSON.stringify(assets, null, 2));

await mongoose.disconnect();
console.log("Done");
