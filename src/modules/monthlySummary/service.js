import { MonthlySummaryModel } from "./model.js";
import BillingExpenseModel from "../expenses/bill/model.js";
import DonationModel from "../expenses/donation/model.js";
import GeneralExpense from "../expenses/general/model.js";
import SalaryExpense from "../expenses/salary/model.js";
import AssetExpense from "../expenses/asset/model.js";
import BusinessExpense from "../expenses/business/model.js";
import mongoose from "mongoose";

/**
 * Determines which month has the most days in a given period.
 * This is useful for labeling periods that span across two months or 
 * for normalizing timezone-shifted start dates (e.g. 00:00 local becoming 19:00 previous day UTC).
 */
const getMajorMonth = (startDate, endDate) => {
    const counts = {};
    let current = new Date(startDate);
    const end = new Date(endDate);

    // Safety counter to prevent infinite loop
    let iters = 0;
    while (current <= end && iters < 60) {
        iters++;
        // Use noon to avoid edge day shifts
        const d = new Date(current.getTime());
        d.setUTCHours(12, 0, 0, 0);

        const y = d.getUTCFullYear();
        const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const key = `${y}-${m}`;

        counts[key] = (counts[key] || 0) + 1;
        current.setUTCDate(current.getUTCDate() + 1);
    }

    let majorKey = null;
    let maxDays = -1;
    for (const key in counts) {
        if (counts[key] > maxDays) {
            maxDays = counts[key];
            majorKey = key;
        }
    }
    return majorKey;
};

/**
 * Generate a monthly summary for a given accounting period using date ranges.
 * Aggregates data from Billing, Salary, Donation, General, Asset, and Business expenses.
 * @param {Object} period - The AccountingPeriod document.
 * @returns {Object} - The structured summary data.
 */
export const generateMonthlySummary = async (period, notes = "") => {
    const { startDate, endDate } = period;

    // Use Major Month logic to determine the key
    const monthStr = getMajorMonth(startDate, endDate);

    // Helper to get Month Name Year string (e.g., "November 2025")
    const [year, month] = monthStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, 1);
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const verboseMonth = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

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
                    { "salaries.accountingPeriod": period._id }, // Strict match
                    // Fallback for legacy data or if periodId is missing in subdoc but date matches
                    {
                        "salaries.accountingPeriod": { $exists: false },
                        $or: [
                            { "salaries.salaryMonth": monthStr },
                            { "salaries.salaryMonth": verboseMonth },
                            { "salaries.salaryMonth": { $regex: new RegExp(`^${monthNames[dateObj.getMonth()]}\\s+${dateObj.getFullYear()}`, 'i') } }
                        ]
                    }
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
        locked: true,
        notes: notes
    };
};

export const createSummary = async (summaryData) => {
    return await MonthlySummaryModel.create(summaryData);
};

export const getLatestClosedSummary = async () => {
    return await MonthlySummaryModel.findOne({ locked: true }).sort({ createdAt: -1 });
};

export const getSummaryByPeriodId = async (periodId) => {
    return await MonthlySummaryModel.findOne({ periodId });
};

export const getAllSummaries = async () => {
    return await MonthlySummaryModel.find({})
        .populate("periodId")
        .sort({ month: -1 });
};
