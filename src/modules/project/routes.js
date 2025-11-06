import express from "express";
import ProController from "./controller.js";
import Middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";

const router = express.Router();


/** First, define specific routes */
router.post('/create', ProController.createProject)       // ➕ Create Project
    .get('/all', ProController.getAllProjects)     // 📜 Get All Projects
    .get('/deleted', ProController.getDeletedProjects)    // 🗑️ Get Deleted Projects
    .put("/soft-delete-all", ProController.deleteAllProjects)
    .delete("/archive-delete-all", ProController.deleteAllDeletedProjectsPermanent);

/** Then, define routes with parameters */
router.get('/:id', ProController.getProjectById)       // 🔍 Get Project by ID
    .put('/update/:id', ProController.updateProject)    // ✏️ Update Project
    .put("/soft-delete/:id", ProController.deleteProjectSoft)
    .delete("/archive-delete/:id", ProController.deleteProjectPermanent);

router.use(Middleware.authenticate);
router

router


/** 🔹 SOFT DELETE (Mark as Deleted) */
router


/** 🔹 PERMANENT DELETE (From Archive) */
router
    .delete("/archive-delete/:id", ProController.deleteProjectPermanent)
    .delete("/archive-delete-all", ProController.deleteAllDeletedProjectsPermanent);

export default router;
