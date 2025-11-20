import SalaryExpense from "./model.js";
import Bank from "../../bank/model.js";
import Repo from "../../../utils/repository.js";
import ApiError from "../../../utils/ApiError.js";
import { uploadMedia } from "../../media/service.js";
import mongoose from "mongoose";

const SalaryRepo = new Repo(SalaryExpense);
const BankRepo = new Repo(Bank);

class SalaryService {
    static createSalary = async (body) => {

        const salaryData = {
            baseSalary: body.baseSalary,
            allowances: body.allowances || 0,
            deductions: body.deductions || 0,
            netSalary: body.netSalary,
            salaryMonth: body.salaryMonth,
            bankName: body.bankName,
        };

        // Check if employee exists
        let employee = await SalaryExpense.findOne({ employeeId: body.employeeId, isDeleted: false });

        if (employee) {
            // Add new salary to array
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
                createdBy: body.createdBy
            });
        }

        // Add to Bank payment history
        const bank = await BankRepo.findById(body.bankId);
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
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw ApiError.badRequest("Invalid ID format");
        }

        // Permanent delete
        const result = await SalaryExpense.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            throw ApiError.notFound("Employee not found");
        }

        return result;
    };

    static deleteMany = async (ids) => {
        // Validate all IDs
        const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));

        if (validIds.length === 0) {
            throw ApiError.badRequest("No valid IDs provided");
        }

        return await SalaryExpense.deleteMany({ _id: { $in: validIds } });
    };

    static getAllSalaries = async () => {
        return await SalaryExpense.find({ isDeleted: false });
    };

    static getSalaryById = async (id) => {
        const employee = await SalaryExpense.findOne({ id, isDeleted: false });
        if (!employee) throw ApiError.notFound("Employee not found");
        return employee;
    };
}

export default SalaryService;
