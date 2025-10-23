import { DepartmentModel } from "./model.js";
import ApiError from "../../utils/ApiError.js";

const departmentService = {
    // ✅ Add Department
    async addDepartment(data) {
        const department = await DepartmentModel.create(data);
        return department;
    },

    // ✅ Get All Departments
    async getAllDepartments() {
        return await DepartmentModel.find().lean();
    },

    // ✅ Get Department by ID
    async getDepartmentById(id) {
        const department = await DepartmentModel.findById(id).lean();
        if (!department) throw new ApiError(404, "Department not found");
        return department;
    },

    // ✅ Update Department
    async updateDepartment(id, data) {
        const updated = await DepartmentModel.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!updated) throw new ApiError(404, "Department not found");
        return updated;
    },
};

export default departmentService;
