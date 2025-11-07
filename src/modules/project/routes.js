import express from "express";
import ProController from "./controller.js";
import Middleware from "../../middleware/auth.middleware.js";
import { checkPermission } from "../../middleware/permissons.js";

const router = express.Router();


router
    .post('/create', ProController.createProject)
    .get('/all', ProController.getAllProjects)
    .get('/deleted', ProController.getDeletedProjects)
    .put("/soft-delete-all", ProController.deleteAllProjects)
    .delete("/archive-delete-all", ProController.deleteAllDeletedProjectsPermanent);


router
    .get('/:id', ProController.getProjectById)
    .put('/update/:id', ProController.updateProject)
    .put("/soft-delete/:id", ProController.deleteProjectSoft)
    .delete("/archive-delete/:id", ProController.deleteProjectPermanent);

router.use(Middleware.authenticate);


export default router;
