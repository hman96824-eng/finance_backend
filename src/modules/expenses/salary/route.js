import express from "express";
import middleware from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";
import parseFormFields from "../../../middleware/parseFormFields.middleware.js";
import SalaryController from "./controller.js";
import { validate } from "../../../middleware/validation.middleware.js";
import validation from "../../../validation/validation.js";


const router = express.Router();



router
    .post("/create", middleware.authenticate, validate(validation.salaryExpenseSchema), SalaryController.createSalary)

    .delete("/delete/:employeeId", middleware.authenticate, SalaryController.deleteSalary)
    .delete("/delete-many", middleware.authenticate, validate(validation.deleteManySchema), SalaryController.deleteManySalary)

    .get("/all", middleware.authenticate, SalaryController.getAllSalaries)
    .get("/:employeeId", middleware.authenticate, SalaryController.getSalaryById)

export default router;
