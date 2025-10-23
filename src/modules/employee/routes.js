import express from "express";
import EmpController from "./controller.js";
import middleware from "../../middleware/auth.middleware.js"

const router = express.Router();

// 🧩 Employee Routes
router.post("/add", middleware.authenticate, EmpController.addEmployee);
router.get("/all", middleware.authenticate, EmpController.getAllEmployees);

router.get("/:id", middleware.authenticate, EmpController.getEmployeeById);
router.put("/update/:id", middleware.authenticate, EmpController.updateEmployee);

export default router;
