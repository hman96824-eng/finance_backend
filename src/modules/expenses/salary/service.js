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
            // Update existing employee doc:
            // BUT wait, each SalaryExpense document should ideally belong to a single AccountingPeriod?
            // The user says "salaries are stored in array of objects".
            // If the same "employee document" is used across multiple months, then `accountingPeriod` on ROOT level is ambiguous.
            // 
            // Look at Model: 
            //   salaries: [SalaryDetailSchema], 
            //   accountingPeriod: { ref: "AccountingPeriod" }
            //
            // If we reuse the same Document for multiple months, the 'accountingPeriod' field will be overwritten or only represent one of them.
            //
            // FIX:
            // 1. If we must support "Array of salaries", ideally the `accountingPeriod` should be inside the array OR we create NEW Document per month.
            // 2. Given the User's Screenshot, they have an Array.
            // 3. AND they have `updatedAt` changing.
            // 4. If I overwrite `accountingPeriod` on the root doc every time I add a salary, then historical reports (Snapshot) will see this doc belonging to the *latest* period only.
            //    This is BAD for historical snapshots if the snapshot query relies on `accountingPeriod`.
            //
            // However, the SNAPSHOT logic relies on `AccountingPeriod` DATES typically.
            // But I effectively changed logic to look for `accountingPeriod` ref in Model?
            // In MonthlySummary Service, I put: 
            // Match salaryMonth string or use Date Range?
            //
            // Let's decide:
            // Option A: One SalaryExpense Doc = One Employee (All History). 
            //    - Pros: Single doc per employee.
            //    - Cons: `accountingPeriod` field on Root is useless/confusing. 
            //    - Aggregation must Unwind and filter by `salaryMonth` string/date.
            //
            // Option B: One SalaryExpense Doc = One Employee + Month.
            //    - Pros: Clean `accountingPeriod` ref.
            //    - Cons: High redundancy of employee details (Name, ID, etc).
            //
            // Mongoose Schema says: `salaries: [SalaryDetailSchema]`. This implies Option A.
            // BUT I added `accountingPeriod` to Root.
            //
            // The USER said: "examine the image i have added this salaray object today but it is not shown in summary"
            // The summary logic failed because of string mismatch.
            //
            // FIX FOR SUMMARY:
            // I should respect the Array structure.
            // I should UNWIND the array and filter the items that fall within the PERIOD's date range.
            // Since `salaryMonth` is a string (e.g. "November 2025"), I need to parse it or standardize it.
            //
            // BETTER: When creating salary, store a proper DATE object inside `salaries` array too, or handle string parsing.
            //
            // Let's look at `SalaryService.createSalary` in `src/modules/expenses/salary/service.js`.
            // It pushes `salaryData`.
            //
            // Let's add specific logic to MonthlySummary service to handle this "String Month" issue.
            // AND I will check if I can improve Salary creation to strict ISO dates.
            //
            // The User's screenshot shows `salaryMonth: "November 2025"`.
            // I will implement a Helper map in MonthlySummary service to match "November 2025" to the period.

            // HOWEVER, the user also said "pass this to every table for reference as start month and close month".
            // If I forcefully update the Root `accountingPeriod` on every salary add, it effectively moves the "Active" pointer of that employee to the current month.
            // If I use `accountingPeriod` for aggregation:
            //   - For the CURRENT OPEN MONTH, it works (doc points to Open Period).
            //   - For CLOSED months... if the user adds a new salary next month, `accountingPeriod` updates to NEW month.
            //   - The OLD closed summary has already been generated (Snapshot). 
            //   - So it doesn't matter if the live doc changes, because the Snapshot is IMMUTABLE.
            //
            // SO:
            // 1. Aggregation for "Close Period" runs ONCE.
            // 2. It finds docs linked to Open Period.
            // 3. For Salary (Array based), if we create a SINGLE doc per employee, we must link it to the OPEN period whenever we modify it?
            //    - If we do that, we catch the Whole Doc.
            //    - But the Doc contains history!
            //    - So we catch 10 years of salaries for "Dakota".
            //    - Then we must filter inside the array for the *Specific Month*.
            //
            // Strategy:
            // 1. Update Salary Controller/Service to update `accountingPeriod` on the Employee Doc when adding salary. (Done in Controller Step 281).
            // 2. In Summary Service:
            //    - Match docs via `accountingPeriod` (or just all valid docs).
            //    - Unwind `salaries`.
            //    - MATCH specific salary item to the Period's Month.
            //    - Function to standardise "November 2025" vs "2025-11".

            // To be safe, I will allow matching by `accountingPeriod` OR Date Range in the Summary Service.

            // Wait, if I use `accountingPeriod` filter on the Root Doc, I get the Doc.
            // Then I unwind.
            // Then I must filter the array items.
            // If I don't filter array items, I sum up ALL history. FAILURE.

            // I need to parse "November 2025".

            // Let's update Salary Service to also ensure `accountingPeriod` is set/updated.
            // And maybe try to standardize `salaryMonth` if possible, but user might send free text.
            // Ideally, we store a `date` object in the sub-schema. 
            // Looking at model, `salaryMonth` is String.
            // `bankName` is String.

            if (body.accountingPeriod) {
                employee.accountingPeriod = body.accountingPeriod;
            }
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
                createdBy: body.createdBy,
                accountingPeriod: body.accountingPeriod // Set it here
            });
        }

        // Add to Bank payment history
        const bank = await BankRepo.findById(body.bankId || body.bankName); // Handle both key names just in case
        if (!bank) throw ApiError.notFound("Bank not found");

        bank.paymentHistory.push({
            project: employee._id.toString(),
            projectName: employee.employeeName,
            clientName: bank.bankName,
            amount: body.netSalary,
            type: "debit",
            note: `Salary for ${body.salaryMonth}`,
            date: body.salaryMonth // This might be invalid date if string "November 2025", but Schema is mixed there? Bank schema paymentHistory date is usually Date.
        });

        // Note: Bank paymentHistory date expect Date? 
        // In previous `Donation` service it used `new Date()`.
        // Here `body.salaryMonth` is string. `new Date("November 2025")` works in JS. 

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

    static getAllSalaries = async () => {
        return await SalaryExpense.find({ isDeleted: false });
    };

    static getSalaryById = async (id) => {
        const employee = await SalaryExpense.findOne({ _id: id, isDeleted: false }); // Fixed query key from 'id' to '_id'
        if (!employee) throw ApiError.notFound("Employee not found");
        return employee;
    };
}

export default SalaryService;
