import ProjectModel from "../project/model.js";
import SalaryModel from "../expenses/salary/model.js";
import AssetExpenseModel from "../expenses/asset/model.js";
import BillModel from "../expenses/bill/model.js";
import BusinessExpenseModel from "../expenses/business/model.js";
import DonationModel from "../expenses/donation/model.js";
import GeneralExpenseModel from "../expenses/general/model.js";
import { EmployeeModel } from "../employee/model.js";
import { LeaveModel } from "../leave/model.js";
import BankModel from "../bank/model.js";
import mongoose from "mongoose";

class AppError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const DashboardService = {

    // ⭐ Dashboard summary for cards - FULL DEBUG VERSION
    getDashboardSummary: async ({ filterType, month, year, range, startMonth, endMonth, models: overrides } = {}) => {
        console.log('=== DASHBOARD SUMMARY DEBUG START ===');
        console.log("Incoming Query Params:", { filterType, month, year, range, startMonth, endMonth });

        // Allow dependency injection for testing: models can be passed in via params.models
        const Models = {
            ProjectModel: overrides?.ProjectModel || ProjectModel,
            SalaryModel: overrides?.SalaryModel || SalaryModel,
            AssetExpenseModel: overrides?.AssetExpenseModel || AssetExpenseModel,
            BillModel: overrides?.BillModel || BillModel,
            BusinessExpenseModel: overrides?.BusinessExpenseModel || BusinessExpenseModel,
            DonationModel: overrides?.DonationModel || DonationModel,
            GeneralExpenseModel: overrides?.GeneralExpenseModel || GeneralExpenseModel,
            EmployeeModel: overrides?.EmployeeModel || EmployeeModel,
            LeaveModel: overrides?.LeaveModel || LeaveModel,
            BankModel: overrides?.BankModel || BankModel
        };

        const now = new Date();

        // Helper: create month range (UTC) and label `Mon-YYYY` e.g. `Jan-2025`
        const createMonthRange = (y, mIdx) => {
            const start = new Date(Date.UTC(y, mIdx, 1, 0, 0, 0, 0));
            const end = new Date(Date.UTC(y, mIdx + 1, 0, 23, 59, 59, 999));
            const monthShort = new Date(y, mIdx, 1).toLocaleString('default', { month: 'short' });
            const label = `${monthShort}-${y}`; // e.g. Jan-2025
            return { label, start, end };
        };

        // Prepare months array based on filterType
        const months = [];
        let fType = filterType || 'month';
        if (range === 'all' || range === 'all_time' || fType === 'all_time') fType = 'all';
        if (range === 'year') fType = 'year';
        if (range === 'month') fType = 'month';

        // If request asks for all time, compute a single aggregate across the whole DB and return it
        if (fType === 'all') {
            console.log('Computing ALL-TIME aggregate (filterType=all)');

            // Total Income: sum project amounts across all projects
            const projAgg = await Models.ProjectModel.aggregate([
                { $project: { amount: { $ifNull: ['$totalAmountPKR', '$budgetPKR'] } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 0] } } } }
            ]);
            const totalIncome = projAgg[0]?.total || 0;

            // Expenses per category (exclude soft-deleted where applicable)
            const assetAgg = await Models.AssetExpenseModel.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
            const billAgg = await Models.BillModel.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
            const businessAgg = await Models.BusinessExpenseModel.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
            const donationAgg = await Models.DonationModel.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
            const generalAgg = await Models.GeneralExpenseModel.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);

            const assetExpense = assetAgg[0]?.total || 0;
            const billExpense = billAgg[0]?.total || 0;
            const businessExpense = businessAgg[0]?.total || 0;
            const donationExpense = donationAgg[0]?.total || 0;
            const generalExpense = generalAgg[0]?.total || 0;

            // Salaries (unwind nested salaries)
            const salariesAgg = await Models.SalaryModel.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $unwind: { path: '$salaries', preserveNullAndEmptyArrays: false } },
                { $group: { _id: null, total: { $sum: '$salaries.netSalary' } } }
            ]);
            const salaryExpense = salariesAgg[0]?.total || 0;

            // Project payments across all projects
            const projectPaymentsAgg = await Models.ProjectModel.aggregate([
                { $unwind: { path: '$bankPayments', preserveNullAndEmptyArrays: false } },
                { $group: { _id: null, total: { $sum: '$bankPayments.amount' } } }
            ]);
            const projectPayments = projectPaymentsAgg[0]?.total || 0;

            // Total bank balance
            const bankBalanceAgg = await Models.BankModel.aggregate([{ $match: { status: 'Active' } }, { $group: { _id: null, total: { $sum: '$balance' } } }]);
            const totalBankBalance = bankBalanceAgg[0]?.total || 0;

            // Active projects count (current snapshot)
            let activeProjects = await Models.ProjectModel.countDocuments({ status: 'Active' });
            if (!activeProjects) activeProjects = await Models.ProjectModel.countDocuments({ status: { $ne: 'Deleted' } });

            // Total employees (all time)
            const totalEmployees = await Models.EmployeeModel.countDocuments({});

            // Total leaves
            const totalLeaves = await Models.LeaveModel.countDocuments({});

            // Compose expenses breakdown and totals
            const expenses = {
                assetExpense,
                businessExpense,
                billExpense,
                donationExpense,
                generalExpense,
                salaryExpense
            };
            const totalExpenses = Object.values(expenses).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);

            const totalSalaries = salaryExpense;
            const totalSalariesGiven = totalSalaries + projectPayments;
            const netProfitLoss = totalIncome - totalExpenses - totalSalariesGiven;

            const agg = {
                periodType: 'all',
                totalIncome,
                totalExpenses,
                expenses,
                // Note: `totalSalaries`, `assetBalance`, and `donationTotal` are intentionally
                // omitted at the top-level because they are included inside `expenses`.
                projectPayments,
                netProfitLoss,
                totalBankBalance,
                activeProjects,
                newEmployees: totalEmployees,
                totalLeaves
            };

            console.log('=== DASHBOARD SUMMARY DEBUG END (ALL AGGREGATE) ===');
            console.log('\n✅ All-time aggregate result:', JSON.stringify(agg, null, 2));
            return [agg];
        }

        // If startMonth/endMonth provided, treat as custom range
        const customRange = startMonth && endMonth;

        if (customRange) {
            // startMonth/endMonth expected as YYYY-MM
            const [sy, sm] = String(startMonth).split('-');
            const [ey, em] = String(endMonth).split('-');
            const sY = parseInt(sy, 10);
            const sM = parseInt(sm, 10) - 1;
            const eY = parseInt(ey, 10);
            const eM = parseInt(em, 10) - 1;
            // build months from start to end inclusive
            let curY = sY;
            let curM = sM;
            while (curY < eY || (curY === eY && curM <= eM)) {
                months.push(createMonthRange(curY, curM));
                curM++;
                if (curM > 11) { curM = 0; curY++; }
            }
        } else if (fType === 'month') {
            let target;
            if (month) {
                // accept various month formats: YYYY-MM, MM (1-12), or numeric month
                if (String(month).includes('-')) {
                    const [yStr, mStr] = String(month).split('-');
                    const yNum = parseInt(yStr, 10);
                    const mNum = parseInt(mStr, 10) - 1;
                    target = createMonthRange(yNum, mNum);
                } else {
                    // month as number (1-12) for current year
                    const mNum = parseInt(month, 10) - 1;
                    target = createMonthRange(now.getUTCFullYear(), mNum);
                }
            } else {
                target = createMonthRange(now.getUTCFullYear(), now.getUTCMonth());
            }
            months.push(target);
        } else if (fType === 'year') {
            const yNum = year ? parseInt(year, 10) : now.getUTCFullYear();
            for (let m = 0; m < 12; m++) months.push(createMonthRange(yNum, m));
        } else if (fType === 'all') {
            const firstProject = await Models.ProjectModel.findOne({}).sort({ createdAt: 1 }).select('createdAt');
            const startDate = firstProject ? new Date(Date.UTC(firstProject.createdAt.getFullYear(), firstProject.createdAt.getMonth(), 1)) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const startYear = startDate.getUTCFullYear();
            const startMonth = startDate.getUTCMonth();
            const totalMonths = (now.getUTCFullYear() - startYear) * 12 + (now.getUTCMonth() - startMonth) + 1;
            for (let i = 0; i < totalMonths; i++) {
                const d = new Date(Date.UTC(startYear, startMonth + i, 1));
                months.push(createMonthRange(d.getUTCFullYear(), d.getUTCMonth()));
            }
        }

        const results = [];

        for (const m of months) {
            console.log('\n=== MONTH RANGE ===');
            console.log(`Processing month: ${m.label}`);
            console.log('Time Range:', m.start.toISOString(), '->', m.end.toISOString());
            // Support multiple formats for salary month matching for this month
            const monthNum = m.start.getUTCMonth() + 1;
            const year = m.start.getUTCFullYear();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const monthFull = monthNames[m.start.getUTCMonth()];
            const monthShort = m.label.split('-')[0]; // e.g., "Jan" from "Jan-2025"
            const salaryMonthFormats = [
                m.label,                                           // Jan-2025
                `${year}-${String(monthNum).padStart(2, '0')}`,   // 2025-01
                `${monthFull} ${year}`,                            // January 2025
                `${monthShort} ${year}`,                           // Jan 2025
                monthFull,                                         // January
                monthShort                                         // Jan
            ];

            // Parallelize DB queries for this month to reduce overall latency
            const [projects, assetAgg, billAgg, businessAgg, donationAgg, generalAgg, salariesAgg, activeProjectsCount, newEmployeesCount, leavesAgg, projectPaymentsAgg, bankBalanceAgg] = await Promise.all([
                // Projects (lean to reduce mongoose overhead)
                Models.ProjectModel.find({ createdAt: { $gte: m.start, $lte: m.end } }).select('totalAmountPKR budgetPKR totalPaid bankPayments projectName status createdAt').lean(),
                // Asset expenses
                Models.AssetExpenseModel.aggregate([
                    { $match: { purchaseDate: { $gte: m.start, $lte: m.end }, isDeleted: { $ne: true } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                // Bills
                Models.BillModel.aggregate([
                    { $match: { billDate: { $gte: m.start, $lte: m.end }, isDeleted: { $ne: true } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                // Business expenses
                Models.BusinessExpenseModel.aggregate([
                    { $match: { purchaseDate: { $gte: m.start, $lte: m.end }, isDeleted: { $ne: true } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                // Donations
                Models.DonationModel.aggregate([
                    { $match: { donationDate: { $gte: m.start, $lte: m.end }, isDeleted: { $ne: true } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                // General expenses
                Models.GeneralExpenseModel.aggregate([
                    { $match: { purchaseDate: { $gte: m.start, $lte: m.end }, isDeleted: { $ne: true } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                // Salaries
                Models.SalaryModel.aggregate([
                    { $match: { isDeleted: { $ne: true } } },
                    { $unwind: '$salaries' },
                    { $match: { 'salaries.salaryMonth': { $in: salaryMonthFormats } } },
                    { $group: { _id: null, total: { $sum: '$salaries.netSalary' } } }
                ]),
                // Active projects count
                Models.ProjectModel.countDocuments({ status: 'Active', createdAt: { $lte: m.end } }),
                // New employees count by contractStartDate
                Models.EmployeeModel.countDocuments({ 'contractDetails.contractStartDate': { $gte: m.start, $lte: m.end } }),
                // Leaves
                Models.LeaveModel.aggregate([
                    { $match: { startDate: { $gte: m.start, $lte: m.end } } },
                    { $count: 'totalLeaves' }
                ]),
                // Project payments
                Models.ProjectModel.aggregate([
                    { $unwind: '$bankPayments' },
                    { $match: { 'bankPayments.date': { $gte: m.start, $lte: m.end } } },
                    { $group: { _id: null, total: { $sum: '$bankPayments.amount' } } }
                ]),
                // Bank balances (active)
                Models.BankModel.aggregate([
                    { $match: { status: 'Active' } },
                    { $group: { _id: null, total: { $sum: '$balance' } } }
                ])
            ]);

            // Total Income: sum ProjectModel.totalAmountPKR (fallbacks handled in JS)
            console.log('Raw Projects in range (lean):', projects);
            const totalIncome = (projects || []).reduce((sum, p) => sum + (typeof p.totalAmountPKR === 'number' ? p.totalAmountPKR : (typeof p.budgetPKR === 'number' ? p.budgetPKR : 0)), 0);
            console.log('Total Income (sum of project amounts):', totalIncome);

            const assetBalance = assetAgg[0]?.total || 0;
            console.log('Asset records aggregate raw:', assetAgg);
            console.log('Asset balance (sum amounts):', assetBalance);

            const billTotal = billAgg[0]?.total || 0;
            const businessTotal = businessAgg[0]?.total || 0;
            const donationTotal = donationAgg[0]?.total || 0;
            const generalTotal = generalAgg[0]?.total || 0;

            console.log('Raw expense aggregates:', { billTotal, businessTotal, donationTotal, generalTotal });

            // Compose totalExpenses (including donations)
            // Note: we'll include salaries into the expenses breakdown later (salary is calculated after)
            let totalExpenses = billTotal + businessTotal + donationTotal + generalTotal + assetBalance;
            console.log('Subtotal Expenses (excluding salary):', totalExpenses);

            const totalSalaries = salariesAgg[0]?.total || 0;
            console.log('Salary month formats being searched:', salaryMonthFormats);
            console.log('Raw salariesAgg:', salariesAgg);
            console.log('Total Salaries for month (sum):', totalSalaries);

            // Active Projects: use value from parallel call, fallback if needed
            let activeProjects = activeProjectsCount;
            if (!activeProjects) {
                activeProjects = await Models.ProjectModel.countDocuments({ status: { $ne: 'Deleted' }, createdAt: { $lte: m.end } });
            }
            console.log('Active Projects count:', activeProjects);

            // New Employees: use parallel result
            const newEmployees = newEmployeesCount;
            console.log('New Employees count (strict by contractDetails.contractStartDate):', newEmployees);

            // Total Leaves: result provided by the parallel call (leavesAgg)
            const totalLeaves = leavesAgg[0]?.totalLeaves || 0;
            console.log('Leaves aggregate raw:', leavesAgg);
            console.log('Total Leaves:', totalLeaves);

            // Project payments: use aggregated value from parallel call
            const projectPayments = projectPaymentsAgg[0]?.total || 0;
            console.log('Project payments aggregate raw:', projectPaymentsAgg);
            console.log('Project payments total:', projectPayments);

            // Total Bank Balance - use value from parallel call
            const totalBankBalance = bankBalanceAgg[0]?.total || 0;
            console.log('Bank balance aggregate raw:', bankBalanceAgg);
            console.log('Total Bank Balance:', totalBankBalance);

            // Build an expenses breakdown object (include salary as one of the expense categories)
            const expenses = {
                assetExpense: assetBalance,
                businessExpense: businessTotal,
                billExpense: billTotal,
                donationExpense: donationTotal,
                generalExpense: generalTotal,
                salaryExpense: totalSalaries
            };

            // Recompute totalExpenses to include salary
            totalExpenses = Object.values(expenses).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
            console.log('Expenses breakdown:', expenses);
            console.log('Total Expenses (including salary):', totalExpenses);

            // Optionally, combine salaries + project payments as "totalSalariesGiven"
            const totalSalariesGiven = totalSalaries + projectPayments;

            // Use combined salaries given (employees + project payments) for profit/loss
            const netProfitLoss = totalIncome - totalExpenses - totalSalariesGiven;

            const summaryObj = {
                month: m.label,
                totalIncome,
                totalExpenses,
                expenses,
                totalSalaries,
                assetBalance,
                donationTotal,
                projectPayments,
                // totalSalariesGiven,
                netProfitLoss,
                // netCashFlow,
                totalBankBalance,
                activeProjects,
                newEmployees,
                totalLeaves
            };
            console.log('Final summary object for month:', summaryObj);
            results.push(summaryObj);
        }

        console.log('\nTotal months processed:', results.length);

        // If the request asked for a full year, return an aggregated yearly summary (single object)
        if (fType === 'year') {
            // Sum numeric top-level fields and per-expense categories
            const yearLabel = months[0] ? `${months[0].start.getUTCFullYear()}` : (new Date()).getUTCFullYear();
            const agg = results.reduce((acc, r) => {
                acc.totalIncome += r.totalIncome || 0;
                acc.totalExpenses += r.totalExpenses || 0;
                acc.totalSalaries += r.totalSalaries || 0;
                acc.assetBalance += r.assetBalance || 0;
                acc.donationTotal += r.donationTotal || 0;
                acc.projectPayments += r.projectPayments || 0;
                acc.netProfitLoss += r.netProfitLoss || 0;
                acc.totalLeaves += r.totalLeaves || 0;
                acc.newEmployees += r.newEmployees || 0;
                // Sum expenses breakdown keys
                const e = r.expenses || {};
                for (const k of Object.keys(acc.expenses)) {
                    acc.expenses[k] += e[k] || 0;
                }
                // track last seen bank balance and activeProjects (use last month's snapshot)
                acc._lastBankBalance = r.totalBankBalance || acc._lastBankBalance;
                acc._lastActiveProjects = r.activeProjects || acc._lastActiveProjects;
                return acc;
            }, {
                year: parseInt(yearLabel, 10),
                periodType: 'year',
                totalIncome: 0,
                totalExpenses: 0,
                expenses: { assetExpense: 0, businessExpense: 0, billExpense: 0, donationExpense: 0, generalExpense: 0, salaryExpense: 0 },
                totalSalaries: 0,
                assetBalance: 0,
                donationTotal: 0,
                projectPayments: 0,
                netProfitLoss: 0,
                totalBankBalance: 0,
                activeProjects: 0,
                newEmployees: 0,
                totalLeaves: 0,
                _lastBankBalance: 0,
                _lastActiveProjects: 0
            });

            // Use last month's bank balance / activeProjects as snapshot values
            agg.totalBankBalance = agg._lastBankBalance || 0;
            agg.activeProjects = agg._lastActiveProjects || 0;
            // remove internal keys
            delete agg._lastBankBalance;
            delete agg._lastActiveProjects;
            // Remove top-level duplicates: these values are available inside `expenses`
            // and should not be repeated at the top level.
            delete agg.totalSalaries;
            delete agg.assetBalance;
            delete agg.donationTotal;

            console.log('=== DASHBOARD SUMMARY DEBUG END (YEAR AGGREGATE) ===');
            console.log('\n✅ Yearly aggregate result:', JSON.stringify(agg, null, 2));
            return [agg];
        }

        // If the request asked for a single month, return an aggregated monthly summary (single object)
        if (fType === 'month') {
            // results contains one or more month objects (usually one)
            const monthLabel = months[0] ? months[0].label : (new Date()).toLocaleString('default', { month: 'short', year: 'numeric' });
            const mAgg = results.reduce((acc, r) => {
                acc.totalIncome += r.totalIncome || 0;
                acc.totalExpenses += r.totalExpenses || 0;
                // sum expense breakdown
                const e = r.expenses || {};
                for (const k of Object.keys(acc.expenses)) {
                    acc.expenses[k] += e[k] || 0;
                }
                acc.projectPayments += r.projectPayments || 0;
                acc.netProfitLoss += r.netProfitLoss || 0;
                acc.newEmployees += r.newEmployees || 0;
                acc.totalLeaves += r.totalLeaves || 0;
                // track last seen bank balance and activeProjects (snapshot)
                acc._lastBankBalance = r.totalBankBalance || acc._lastBankBalance;
                acc._lastActiveProjects = r.activeProjects || acc._lastActiveProjects;
                return acc;
            }, {
                month: monthLabel,
                periodType: 'month',
                totalIncome: 0,
                totalExpenses: 0,
                expenses: { assetExpense: 0, businessExpense: 0, billExpense: 0, donationExpense: 0, generalExpense: 0, salaryExpense: 0 },
                projectPayments: 0,
                netProfitLoss: 0,
                totalBankBalance: 0,
                activeProjects: 0,
                newEmployees: 0,
                totalLeaves: 0,
                _lastBankBalance: 0,
                _lastActiveProjects: 0
            });

            // snapshot values
            mAgg.totalBankBalance = mAgg._lastBankBalance || 0;
            mAgg.activeProjects = mAgg._lastActiveProjects || 0;
            delete mAgg._lastBankBalance;
            delete mAgg._lastActiveProjects;
            // ensure duplicates are not present at top-level (they live inside expenses)
            delete mAgg.totalSalaries;
            delete mAgg.assetBalance;
            delete mAgg.donationTotal;

            console.log('=== DASHBOARD SUMMARY DEBUG END (MONTH AGGREGATE) ===');
            console.log('\n✅ Monthly aggregate result:', JSON.stringify(mAgg, null, 2));
            return [mAgg];
        }

        console.log('=== DASHBOARD SUMMARY DEBUG END ===');
        console.log('\n✅ Final results:', JSON.stringify(results, null, 2));
        return results;
    },

    // ⭐ Dashboard charts
    getDashboardCharts: async (params = {}) => {
        const p = { ...(params || {}) };
        const safeNum = (v) => Number(typeof v === 'number' ? v : (v ? v : 0));

        // Helper label chooser
        const getLabel = (s, fallback) => {
            if (!s) return fallback || '';
            if (s.month) return s.month;
            if (s.periodType === 'year' && s.year) return String(s.year);
            if (s.periodType === 'all') return 'All Time';
            return s.label || s.period || fallback || '';
        };

        // WEEK SPLIT helper: split a month into weeks of fixed 7-day buckets starting at day 1
        const splitMonthIntoWeeks = (year, monthZeroIdx) => {
            const first = new Date(year, monthZeroIdx, 1);
            const daysInMonth = new Date(year, monthZeroIdx + 1, 0).getDate();
            const weeks = [];
            let day = 1;
            while (day <= daysInMonth) {
                const start = new Date(year, monthZeroIdx, day, 0, 0, 0, 0);
                const endDay = Math.min(day + 6, daysInMonth);
                const end = new Date(year, monthZeroIdx, endDay, 23, 59, 59, 999);
                const label = `${String(day).padStart(2, '0')}-${String(endDay).padStart(2, '0')} ${first.toLocaleString('default', { month: 'short' })} ${year}`;
                weeks.push({ label, start, end, days: endDay - day + 1 });
                day = endDay + 1;
            }
            return { weeks, daysInMonth };
        };

        // If user asked for all-time, return one point per year from first project to now
        if ((p.range === 'all' || p.filterType === 'all' || p.fType === 'all')) {
            // find first project to determine start year
            const firstProject = await ProjectModel.findOne({}).sort({ createdAt: 1 }).select('createdAt');
            const startDate = firstProject ? new Date(firstProject.createdAt) : new Date();
            const startYear = startDate.getFullYear();
            const endYear = new Date().getFullYear();
            const points = [];
            for (let y = startYear; y <= endYear; y++) {
                // request monthly breakdown for the year and sum
                const yrStart = `${y}-01`;
                const yrEnd = `${y}-12`;
                const monthly = await DashboardService.getDashboardSummary({ startMonth: yrStart, endMonth: yrEnd });
                // monthly is array of month objects; sum fields
                const agg = monthly.reduce((acc, r) => {
                    acc.totalIncome += safeNum(r.totalIncome);
                    acc.totalExpenses += safeNum(r.totalExpenses);
                    acc.totalSalaries += safeNum(r.totalSalaries || r.expenses?.salaryExpense || r.salaryExpense);
                    acc.netProfitLoss += safeNum(r.netProfitLoss);
                    return acc;
                }, { year: y, periodType: 'year', totalIncome: 0, totalExpenses: 0, totalSalaries: 0, netProfitLoss: 0 });
                points.push(agg);
            }

            return {
                income: points.map((s) => ({ month: String(s.year), value: s.totalIncome })),
                expenses: points.map((s) => ({ month: String(s.year), value: s.totalExpenses })),
                salaries: points.map((s) => ({ month: String(s.year), value: s.totalSalaries })),
                netProfitLoss: points.map((s) => ({ month: String(s.year), value: s.netProfitLoss }))
            };
        }

        // If user asked for a year-level chart, produce monthly points for that year
        if (p.filterType === 'year' || p.year) {
            const y = p.year ? String(p.year) : String(new Date().getFullYear());
            const startMonth = `${y}-01`;
            const endMonth = `${y}-12`;
            const months = await DashboardService.getDashboardSummary({ startMonth, endMonth });

            // Ensure we have a full 12-month series (Jan..Dec) with zero-fill where missing
            const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthsMap = {};
            (months || []).forEach((s) => {
                const label = s.month || (s.label || '');
                monthsMap[label] = s;
            });

            const incomeSeries = [];
            const expensesSeries = [];
            const salariesSeries = [];
            const profitSeries = [];

            for (let mi = 0; mi < 12; mi++) {
                const label = `${monthNamesShort[mi]}-${y}`;
                const s = monthsMap[label] || { totalIncome: 0, totalExpenses: 0, totalSalaries: 0, expenses: {}, salaryExpense: 0, netProfitLoss: 0 };
                incomeSeries.push({ month: label, value: safeNum(s.totalIncome) });
                expensesSeries.push({ month: label, value: safeNum(s.totalExpenses || s.expenses?.salaryExpense || s.salaryExpense || 0) });
                salariesSeries.push({ month: label, value: safeNum(s.totalSalaries || s.expenses?.salaryExpense || s.salaryExpense || 0) });
                profitSeries.push({ month: label, value: safeNum(s.netProfitLoss) });
            }

            return {
                income: incomeSeries,
                expenses: expensesSeries,
                salaries: salariesSeries,
                netProfitLoss: profitSeries
            };
        }

        // If user asked for a month, produce weekly points for that month
        if (p.filterType === 'month' || p.month) {
            // normalize month param (YYYY-MM expected) or default to current month
            let targetMonth = p.month;
            const now = new Date();
            if (!targetMonth) {
                targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }
            const [yy, mm] = String(targetMonth).split('-');
            const yNum = parseInt(yy, 10);
            const mNum = parseInt(mm, 10) - 1;

            // get monthly totals from dashboard service
            const monthly = await DashboardService.getDashboardSummary({ startMonth: targetMonth, endMonth: targetMonth });
            const monthObj = Array.isArray(monthly) && monthly.length ? monthly[0] : null;
            const totalIncome = safeNum(monthObj?.totalIncome);
            const totalExpenses = safeNum(monthObj?.totalExpenses);
            const totalSalaries = safeNum(monthObj?.totalSalaries || monthObj?.expenses?.salaryExpense || monthObj?.salaryExpense);
            const netProfitLoss = safeNum(monthObj?.netProfitLoss);

            const { weeks, daysInMonth } = splitMonthIntoWeeks(yNum, mNum);
            // distribute totals proportionally by days in each week
            const incomeSeries = weeks.map((w) => ({ month: w.label, value: +(totalIncome * (w.days / daysInMonth)).toFixed(2) }));
            const expensesSeries = weeks.map((w) => ({ month: w.label, value: +(totalExpenses * (w.days / daysInMonth)).toFixed(2) }));
            const salariesSeries = weeks.map((w) => ({ month: w.label, value: +(totalSalaries * (w.days / daysInMonth)).toFixed(2) }));
            const profitSeries = weeks.map((w) => ({ month: w.label, value: +(netProfitLoss * (w.days / daysInMonth)).toFixed(2) }));

            return {
                income: incomeSeries,
                expenses: expensesSeries,
                salaries: salariesSeries,
                netProfitLoss: profitSeries
            };
        }

        // Default: fall back to monthly summary behavior
        const summary = await DashboardService.getDashboardSummary(p);
        return {
            income: summary.map((s) => ({ month: getLabel(s), value: safeNum(s.totalIncome) })),
            expenses: summary.map((s) => ({ month: getLabel(s), value: safeNum(s.totalExpenses) })),
            salaries: summary.map((s) => ({ month: getLabel(s), value: safeNum(s.totalSalaries || s.expenses?.salaryExpense || s.salaryExpense) })),
            netProfitLoss: summary.map((s) => ({ month: getLabel(s), value: safeNum(s.netProfitLoss) }))
        };
    }

};

// 🔹 Helper to calculate last N months or given range
function getMonthsRange(startMonth, endMonth, range = 6) {
    const months = [];
    const current = new Date();
    for (let i = range - 1; i >= 0; i--) {
        const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const label = d.toLocaleString("default", { month: "short", year: "numeric" });
        months.push({ label, start, end });
    }
    return months;
}

export default DashboardService;
