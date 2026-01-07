import ExpenseCategoryService from "./service.js";
import { successResponse } from "../../../utils/response.helper.js";

const ExpenseCategoryController = {
    createCategory: async (req, res, next) => {
        try {
            const category = await ExpenseCategoryService.createCategory(req.body);
            return successResponse(res, category, "Category created successfully");
        } catch (err) {
            next(err);
        }
    },

    getAllCategories: async (req, res, next) => {
        try {
            const { type } = req.query;
            const categories = await ExpenseCategoryService.getAllCategories(type);
            return successResponse(res, categories, "Categories fetched successfully");
        } catch (err) {
            next(err);
        }
    },

    deleteCategory: async (req, res, next) => {
        try {
            const category = await ExpenseCategoryService.deleteCategory(req.params.id);
            return successResponse(res, category, "Category deleted successfully");
        } catch (err) {
            next(err);
        }
    },
};

export default ExpenseCategoryController;
