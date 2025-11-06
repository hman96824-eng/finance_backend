import mongoose from "mongoose";
import BankModel from "../src/modules/bank/model.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO = process.env.MONGODB_URI;

async function cleanup() {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

    const cursor = BankModel.find().cursor();
    let totalCleaned = 0;
    for (let bank = await cursor.next(); bank != null; bank = await cursor.next()) {
        const originalLen = (bank.paymentHistory || []).length;
        bank.paymentHistory = (bank.paymentHistory || []).filter((tx) => {
            return tx && tx.project && mongoose.Types.ObjectId.isValid(String(tx.project));
        });
        const cleanedLen = bank.paymentHistory.length;
        if (cleanedLen !== originalLen) {
            await bank.save();
            totalCleaned += originalLen - cleanedLen;
            console.log(`Cleaned bank ${bank._id}: removed ${originalLen - cleanedLen} invalid entries`);
        }
    }

    console.log("Done. Total invalid entries removed:", totalCleaned);
    await mongoose.disconnect();
}

cleanup().catch((err) => {
    console.error("Cleanup error:", err);
    process.exit(1);
});