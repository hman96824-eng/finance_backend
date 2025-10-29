import express from "express";
import ProController from "./controller.js";
import Middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";

const router = express.Router();


router.use(Middleware.authenticate, checkPermission("manage_project"));

router
    .route("/")
    .post(ProController.createProject)       // ➕ Create Project
    .get(ProController.getAllProjects);      // 📜 Get All Projects

router
    .route("/:id")
    .get(ProController.getProjectById)       // 🔍 Get Project by ID
    .put(ProController.updateProject);       // ✏️ Update Project


/** 🔹 SOFT DELETE (Mark as Deleted) */
router
    .put("/soft-delete/:id", ProController.deleteProjectSoft)
    .put("/soft-delete-all", ProController.deleteAllProjectsSoft);


/** 🔹 FETCH DELETED PROJECTS */
router.get("/deleted", ProController.getDeletedProjects);


/** 🔹 PERMANENT DELETE (From Archive) */
router
    .delete("/archive-delete/:id", ProController.deleteProjectPermanent)
    .delete("/archive-delete-all", ProController.deleteAllDeletedProjectsPermanent);

export default router;
