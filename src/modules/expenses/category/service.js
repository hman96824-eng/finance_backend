import ExpenseCategory from "./model.js";
import ApiError from "../../../utils/ApiError.js";
import repository from "../../../utils/repository.js";

const CategoryRepo = new repository(ExpenseCategory);

class ExpenseCategoryService {
    static createCategory = async (data) => {
        const { name, type } = data;
        const existing = await CategoryRepo.findOne({ name: name.trim() });
        if (existing) {
            throw ApiError.badRequest("Category with this name already exists");
        }
        return await CategoryRepo.create({ name: name.trim(), type });
    };

    static getAllCategories = async (type) => {
        const query = { isDeleted: false, status: "Active" };
        if (type) {
            query.type = type;
        }
        return await ExpenseCategory.find(query).sort({ name: 1 });
    };

    static deleteCategory = async (id) => {
        const category = await CategoryRepo.findOne({ _id: id });
        if (!category) throw ApiError.notFound("Category not found");
        return await CategoryRepo.findOneAndUpdate({ _id: id }, { isDeleted: true }, { new: true });
    };
}

export default ExpenseCategoryService;
