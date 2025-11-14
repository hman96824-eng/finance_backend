import express from "express";
import SalaryController from "./controller.js";
import Middleware from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(Middleware.authenticate);

router
    .post("/create", SalaryController.createSalary)
    .get("/all", SalaryController.getAllSalaries)
    .get("/:id", SalaryController.getSalaryById)
    .put("/update/:id", SalaryController.updateSalary)
    .delete("/delete/:id", SalaryController.deleteSalary);

router
    .patch("/:id/approve", SalaryController.approveSalary)
    .patch("/:id/reject", SalaryController.rejectSalary);

export default router;
