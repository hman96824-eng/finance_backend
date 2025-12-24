import SalaryExpense from "./model.js";
import Bank from "../../bank/model.js";
import Repo from "../../../utils/repository.js";
import ApiError from "../../../utils/ApiError.js";
import mongoose from "mongoose";
import { validateExpenseDate } from "../../../utils/dateValidation.js";


const SalaryRepo = new Repo(SalaryExpense);
const BankRepo = new Repo(Bank);

class SalaryService {
    static createSalary = async (body) => {
        await validateExpenseDate(body.salaryMonth, "Salary Month", true);



        // Validate accountingPeriod exists
        if (!body.accountingPeriod) {
            throw ApiError.badRequest("Accounting period is required");
        }

        const salaryData = {
            baseSalary: body.baseSalary,
            allowances: body.allowances || 0,
            deductions: body.deductions || 0,
            netSalary: body.netSalary,
            salaryMonth: body.salaryMonth,
            bankName: body.bankName,
            accountingPeriod: body.accountingPeriod // Pass ID to the salary object
        };

        // Check if employee exists
        let employee = await SalaryExpense.findOne({ employeeId: body.employeeId, isDeleted: false });

        if (employee) {
            // Check duplicates
            const existing = employee.salaries.find(s => s.salaryMonth === body.salaryMonth);
            if (existing) {
                throw ApiError.badRequest(`Salary for ${body.salaryMonth} already exists for this employee.`);
            }

            // Update root accountingPeriod to current just for activity tracking, though it's now ambiguous at root level
            employee.accountingPeriod = body.accountingPeriod;
            employee.salaries.push(salaryData);
            await employee.save();
        } else {
            // Create new employee with first salary
            employee = await SalaryExpense.create({
                employeeName: body.employeeName,
                employeeId: body.employeeId,
                designation: body.designation,
                department: body.department,
                salaries: [salaryData],
                createdBy: body.createdBy,
                accountingPeriod: body.accountingPeriod // Root level
            });
        }

        // Add to Bank payment history
        const bank = await BankRepo.findById(body.bankId || body.bankName);
        if (!bank) throw ApiError.notFound("Bank not found");

        bank.paymentHistory.push({
            project: employee._id.toString(),
            projectName: employee.employeeName,
            clientName: bank.bankName,
            amount: body.netSalary,
            type: "debit",
            note: `Salary for ${body.salaryMonth}`,
            date: body.salaryMonth
        });

        await bank.save();

        return employee;
    };

    static deleteSalary = async (id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw ApiError.badRequest("Invalid ID format");
        }
        const result = await SalaryExpense.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
            throw ApiError.notFound("Employee not found");
        }
        return result;
    };

    static deleteMany = async (ids) => {
        const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length === 0) {
            throw ApiError.badRequest("No valid IDs provided");
        }
        return await SalaryExpense.deleteMany({ _id: { $in: validIds } });
    };

    static getAllSalaries = async (accountingPeriod, page = 1, limit = 10) => {
        const skip = (Number(page) - 1) * Number(limit);
        // Prepare search criteria
        let monthString = null;
        let verboseMonth = null;
        let periodId = null;

        if (accountingPeriod) {
            if (accountingPeriod.startDate) {
                const start = new Date(accountingPeriod.startDate);
                monthString = start.toISOString().substring(0, 7); // "YYYY-MM"
                const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
                verboseMonth = `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
            }
            if (accountingPeriod._id) {
                periodId = accountingPeriod._id;
            }
        }

        const query = { isDeleted: false };
        if (monthString || periodId) {
            let filterCondition = [];

            if (periodId) {
                // 1. Strict match by ID
                filterCondition.push({ $eq: ["$$s.accountingPeriod", new mongoose.Types.ObjectId(periodId)] });
            }

            if (monthString && verboseMonth) {
                // 2. Fallback: Match by month string, BUT ONLY IF accountingPeriod is missing
                // This prevents matching records that belong to a DIFFERENT period in the same month
                filterCondition.push({
                    $and: [
                        { $eq: [{ $type: "$$s.accountingPeriod" }, "missing"] }, // Ensure period ID is missing
                        { $eq: ["$$s.salaryMonth", verboseMonth] }
                    ]
                });
            }

            const aggregationPipeline = [
                { $match: query },
                {
                    $project: {
                        employeeName: 1,
                        employeeId: 1,
                        designation: 1,
                        department: 1,
                        createdBy: 1,
                        isDeleted: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        accountingPeriod: 1,
                        salaries: {
                            $filter: {
                                input: "$salaries",
                                as: "s",
                                cond: {
                                    $or: filterCondition
                                }
                            }
                        }
                    }
                },
                { $match: { "salaries.0": { $exists: true } } }
            ];

            // Get total count
            const countResult = await SalaryExpense.aggregate([
                ...aggregationPipeline,
                { $count: "total" }
            ]);
            const total = countResult.length > 0 ? countResult[0].total : 0;

            const data = await SalaryExpense.aggregate([
                ...aggregationPipeline,
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) }
            ]);

            return {
                data,
                pagination: {
                    total,
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    pageSize: Number(limit),
                }
            };
        }

        const total = await SalaryExpense.countDocuments(query);
        const data = await SalaryExpense.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        return {
            data,
            pagination: {
                total,
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                pageSize: Number(limit),
            }
        };
    };

    static getSalaryById = async (id) => {
        const employee = await SalaryExpense.findOne({ _id: id, isDeleted: false });
        if (!employee) throw ApiError.notFound("Employee not found");
        return employee;
    };
}

export default SalaryService;
