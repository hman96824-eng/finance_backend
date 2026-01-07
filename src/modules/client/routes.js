import express from "express";
import * as clientController from "./controller.js";

const router = express.Router();

router.post("/", clientController.addClient);
router.get("/", clientController.getAllClients);
router.post("/bulk-delete", clientController.bulkDeleteClients);
router.put("/:id", clientController.updateClient);
router.delete("/:id", clientController.deleteClient);

export default router;
