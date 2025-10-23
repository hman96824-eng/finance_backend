import { SalaryModel } from "./model.js";
import ApiError from "../../utils/ApiError.js";

const salaryService = {
    // ✅ Add Salary
    async addSalary(data) {
        const salary = await SalaryModel.create(data);
        return salary;
    },

    // ✅ Get All Salaries
    async getAllSalaries() {
        return await SalaryModel.find().populate("employee", "employeeCode").lean();
    },

    // ✅ Get Salary by Employee ID
    async getSalaryByEmployee(employeeId) {
        const salary = await SalaryModel.findOne({ employee: employeeId })
            .populate("employee", "employeeCode")
            .lean();
        if (!salary) throw new ApiError(404, "Salary not found");
        return salary;
    },

    // ✅ Update Salary
    async updateSalary(id, data) {
        const updated = await SalaryModel.findByIdAndUpdate(id, data, { new: true });
        if (!updated) throw new ApiError(404, "Salary not found");
        return updated;
    },
};

export default salaryService;
