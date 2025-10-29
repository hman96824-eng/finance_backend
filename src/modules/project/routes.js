import express from "express";
import ProController from "./controller.js";
import Middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";

const router = express.Router();


// router.use(Middleware.authenticate, checkPermission("manage_project"));

/** 🔹 FETCH DELETED PROJECTS - Must be before /:id route */
router.get("/deleted", ProController.getDeletedProjects);

router
    .post('/create', ProController.createProject)       // ➕ Create Project
    .get('/all', ProController.getAllProjects);      // 📜 Get All Projects

router
    .get('/:id', ProController.getProjectById)       // 🔍 Get Project by ID
    .put('/update/:id', ProController.updateProject);       // ✏️ Update Project


/** 🔹 SOFT DELETE (Mark as Deleted) */
router
    .put("/soft-delete/:id", ProController.deleteProjectSoft)
    .put("/soft-delete-all", ProController.deleteAllProjectsSoft);


/** 🔹 PERMANENT DELETE (From Archive) */
router
    .delete("/archive-delete/:id", ProController.deleteProjectPermanent)
    .delete("/archive-delete-all", ProController.deleteAllDeletedProjectsPermanent);

export default router;
