import { MonthlySummaryModel } from "./model.js";
import BillingExpenseModel from "../expenses/bill/model.js";
import DonationModel from "../expenses/donation/model.js";
import GeneralExpense from "../expenses/general/model.js";
import SalaryExpense from "../expenses/salary/model.js";
import AssetExpense from "../expenses/asset/model.js";
import BusinessExpense from "../expenses/business/model.js";
import mongoose from "mongoose";

/**
 * Generate a monthly summary for a given accounting period using date ranges.
 * Aggregates data from Billing, Salary, Donation, General, Asset, and Business expenses.
 * @param {Object} period - The AccountingPeriod document.
 * @returns {Object} - The structured summary data.
 */
export const generateMonthlySummary = async (period) => {
    const { startDate, endDate } = period;
    // Use startDate YYYY-MM as the key
    const monthStr = startDate.toISOString().substring(0, 7);

    // Helper to get Month Name Year string (e.g., "November 2025")
    const start = new Date(startDate);
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const verboseMonth = `${monthNames[start.getMonth()]} ${start.getFullYear()}`;

    // 1. Billing Expenses Aggregation
    const billingStats = await BillingExpenseModel.aggregate([
        {
            $match: {
                $or: [
                    { accountingPeriod: period._id },
                    { billDate: { $gte: startDate, $lte: endDate } }
                ],
                isDeleted: false,
                status: "Active"
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
                items: {
                    $push: {
                        title: "$title",
                        amount: "$amount",
                        date: "$billDate",
                        paidBy: "$paidBy"
                    }
                }
            }
        }
    ]);

    // 2. Donation Expenses Aggregation
    const donationStats = await DonationModel.aggregate([
        {
            $match: {
                $or: [
                    { accountingPeriod: period._id },
                    { donationDate: { $gte: startDate, $lte: endDate } }
                ],
                isDeleted: false,
                status: "Active"
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
                items: {
                    $push: {
                        title: "$title",
                        amount: "$amount",
                        date: "$donationDate",
                        donatedBy: "$donatedBy"
                    }
                }
            }
        }
    ]);

    // 3. General Expenses Aggregation
    const generalStats = await GeneralExpense.aggregate([
        {
            $match: {
                $or: [
                    { accountingPeriod: period._id },
                    { purchaseDate: { $gte: startDate, $lte: endDate } }
                ],
                isDeleted: false,
                status: "Active"
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
                items: {
                    $push: {
                        title: "$title",
                        amount: "$amount",
                        date: "$purchaseDate",
                        category: "$category"
                    }
                }
            }
        }
    ]);

    // 4. Asset Expenses Aggregation
    const assetStats = await AssetExpense.aggregate([
        {
            $match: {
                $or: [
                    { accountingPeriod: period._id },
                    { purchaseDate: { $gte: startDate, $lte: endDate } }
                ],
                isDeleted: false,
                status: "Active"
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
                items: {
                    $push: {
                        title: "$title",
                        amount: "$amount",
                        date: "$purchaseDate",
                        purchaseBy: "$purchaseBy"
                    }
                }
            }
        }
    ]);

    // 5. Business Expenses Aggregation
    const businessStats = await BusinessExpense.aggregate([
        {
            $match: {
                $or: [
                    { accountingPeriod: period._id },
                    { purchaseDate: { $gte: startDate, $lte: endDate } }
                ],
                isDeleted: false,
                status: "Active"
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
                items: {
                    $push: {
                        title: "$title",
                        amount: "$amount",
                        date: "$purchaseDate",
                        paidBy: "$paidBy"
                    }
                }
            }
        }
    ]);

    // 6. Salary Aggregation
    const salaryStats = await SalaryExpense.aggregate([
        {
            $match: {
                isDeleted: false
            }
        },
        { $unwind: "$salaries" },
        {
            $match: {
                $or: [
                    { "salaries.salaryMonth": monthStr }, // "2025-11"
                    { "salaries.salaryMonth": verboseMonth }, // "November 2025"
                    { "salaries.salaryMonth": { $regex: new RegExp(`^${monthNames[start.getMonth()]}\\s+${start.getFullYear()}`, 'i') } }
                ]
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$salaries.netSalary" },
                items: {
                    $push: {
                        employeeName: "$employeeName",
                        designation: "$designation",
                        netSalary: "$salaries.netSalary",
                        salaryMonth: "$salaries.salaryMonth"
                    }
                }
            }
        }
    ]);

    const billingData = billingStats[0] || { total: 0, items: [] };
    const donationData = donationStats[0] || { total: 0, items: [] };
    const generalData = generalStats[0] || { total: 0, items: [] };
    const assetData = assetStats[0] || { total: 0, items: [] };
    const businessData = businessStats[0] || { total: 0, items: [] };
    const salaryData = salaryStats[0] || { total: 0, items: [] };

    const overallTotal = billingData.total + donationData.total + generalData.total + assetData.total + businessData.total + salaryData.total;

    return {
        periodId: period._id,
        month: monthStr,
        totals: {
            billing: billingData.total,
            salary: salaryData.total,
            donation: donationData.total,
            general: generalData.total,
            assets: assetData.total,
            business: businessData.total,
            overallTotal: overallTotal
        },
        breakdown: {
            billing: billingData.items,
            salary: salaryData.items,
            donation: donationData.items,
            general: generalData.items,
            assets: assetData.items,
            business: businessData.items
        },
        locked: true
    };
};

export const createSummary = async (summaryData) => {
    return await MonthlySummaryModel.create(summaryData);
};

export const getLatestClosedSummary = async () => {
    return await MonthlySummaryModel.findOne({ locked: true }).sort({ createdAt: -1 });
};
