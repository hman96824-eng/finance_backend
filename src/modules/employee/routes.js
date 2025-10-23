import express from "express";
import EmpController from "./controller.js";
import middleware from "../../middleware/auth.middleware.js"
import upload from "../../middleware/upload.middleware.js"
import parseFormFields from "../../middleware/parseFormFields.middleware.js";


const router = express.Router();

// 🧩 Employee Routes

router.post("/add", upload.single("avatar"), parseFormFields, middleware.authenticate, EmpController.addEmployee);
router.get("/all", middleware.authenticate, EmpController.getAllEmployees);

router.get("/:id", middleware.authenticate, EmpController.getEmployeeById);
router.put("/update/:id", middleware.authenticate, EmpController.updateEmployee)
// .put("/upload-avatar/:id", middleware.authenticate, EmpController.uploadEmployeeAvatar);

export default router;
