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

    static getAllSalaries = async (accountingPeriod, page = 1, limit = 10, search = "") => {
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
        if (search) {
            query.$or = [
                { employeeName: { $regex: search, $options: "i" } },
                { employeeId: { $regex: search, $options: "i" } }
            ];
        }

        if (monthString || periodId) {
            let filterCondition = [];

            if (periodId) {
                // 1. Strict match by ID
                filterCondition.push({ $eq: ["$$s.accountingPeriod", new mongoose.Types.ObjectId(periodId)] });
            }

            if (monthString && verboseMonth) {
                filterCondition.push({ $eq: ["$$s.salaryMonth", verboseMonth] });
            }
            return await SalaryExpense.aggregate([
                { $match: { isDeleted: false } },
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
            ]);

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

    static getSalaryByEmployee = async (identifier) => {
        let employee = await SalaryExpense.findOne({
            employeeId: identifier,
            isDeleted: false
        });
        // If not found by employeeId, search by email
        if (!employee) {
            const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const employeeModel = await mongoose.connection.db.collection('employees').findOne({
                email: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') }
            });

            if (employeeModel) {
                console.log('Found employee model by email:', employeeModel);
                // Try to match salary by both ObjectId and employeeCode
                employee = await SalaryExpense.findOne({
                    $or: [
                        { employeeId: employeeModel._id.toString() },
                        { employeeId: employeeModel.employeeCode }
                    ],
                    isDeleted: false
                });

            }
        }

        if (!employee) {
            throw ApiError.notFound(
                `No salary records found for employee with ID or email: ${identifier}`
            );
        }
        return employee;
    };

    static getMySalaryInfo = async (employeeId, userEmail) => {
        try {
            console.log('🔎 Salary Service: Finding employee with:', { employeeId, userEmail });

            let finalEmployeeId = employeeId;

            // If no employeeId provided, find by user's email
            if (!finalEmployeeId && userEmail) {
                const escapedEmail = userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const employeeModel = await mongoose.connection.db.collection('employees').findOne({
                    email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
                });
                console.log('👨‍💼 Found employee by email:', employeeModel ? 'Yes' : 'No');

                if (!employeeModel) {
                    throw ApiError.notFound(
                        `Employee record not found for email: ${userEmail}. Please contact admin to create your employee profile first.`
                    );
                }

                // Store both ObjectId and employeeCode for flexible matching
                finalEmployeeId = employeeModel._id.toString();
                console.log('🆔 Employee found - ID:', finalEmployeeId, 'Code:', employeeModel.employeeCode);
            }

            if (!finalEmployeeId) {
                throw ApiError.badRequest("Employee ID or email is required");
            }

            console.log('🔍 Searching salary with employeeId:', finalEmployeeId);

            // Try to find by employeeId (could be ObjectId or Employee Code like EMP-023)
            let salaryRecord = await SalaryExpense.findOne({
                employeeId: finalEmployeeId,
                isDeleted: false
            });

            // If not found and we have email, try with employeeCode as well
            if (!salaryRecord && userEmail) {
                const escapedEmail = userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const employeeModel = await mongoose.connection.db.collection('employees').findOne({
                    email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
                });

                if (employeeModel && employeeModel.employeeCode) {
                    console.log('🔄 Trying with employeeCode:', employeeModel.employeeCode);
                    salaryRecord = await SalaryExpense.findOne({
                        $or: [
                            { employeeId: employeeModel._id.toString() },
                            { employeeId: employeeModel.employeeCode }
                        ],
                        isDeleted: false
                    });
                }
            }

            console.log('📋 Found salary record:', salaryRecord ? 'Yes' : 'No');

            if (!salaryRecord) {
                throw ApiError.notFound(
                    `No salary records found for this employee. Please contact admin.`
                );
            }

            // Calculate total salary info
            const totalSalaries = salaryRecord.salaries.length;
            const latestSalary = salaryRecord.salaries[salaryRecord.salaries.length - 1];

            const totalEarnings = salaryRecord.salaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);

            console.log('✅ Successfully retrieved salary info');

            return {
                employee: {
                    name: salaryRecord.employeeName,
                    employeeId: salaryRecord.employeeId,
                    designation: salaryRecord.designation,
                    department: salaryRecord.department
                },
                totalSalaries,
                latestSalary: latestSalary ? {
                    month: latestSalary.salaryMonth,
                    baseSalary: latestSalary.baseSalary,
                    allowances: latestSalary.allowances,
                    deductions: latestSalary.deductions,
                    netSalary: latestSalary.netSalary,
                    bankName: latestSalary.bankName
                } : null,
                totalEarnings,
                salaries: salaryRecord.salaries,
                createdAt: salaryRecord.createdAt
            };
        } catch (err) {
            console.error('❌ Service Error in getMySalaryInfo:', err);
            // Re-throw the original error
            if (err instanceof ApiError) throw err;
            throw ApiError.internalServerError(err.message || "Failed to fetch salary information");
        }
    };
}


export default SalaryService;
