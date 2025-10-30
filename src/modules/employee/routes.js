import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import upload from "../../middleware/upload.middleware.js";
import EmpController from "./controller.js";
import parseFormFields from "../../middleware/parseFormFields.middleware.js";

const router = express.Router();

// 🧩 Employee Routes
router.post("/add", middleware.authenticate, parseFormFields, upload.single("avatar"), EmpController.createEmployee
);

router.get("/all", middleware.authenticate, EmpController.getAllEmployees);
router.get("/deleted", middleware.authenticate, EmpController.getDeletedEmployees
);
router.get("/:id", middleware.authenticate, EmpController.getEmployeeById);
router.put("/update/:id", middleware.authenticate, EmpController.updateEmployee
);
router.put("/delete/:id", middleware.authenticate, EmpController.softDeleteEmployee
);
router.delete("/hard-delete/:id", middleware.authenticate, EmpController.deleteEmployee
);
router.delete("/delete-all", middleware.authenticate, EmpController.deleteAllEmployees
);

export default router;
