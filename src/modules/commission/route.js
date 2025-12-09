import express from "express";
import middleware from "../../middleware/auth.middleware.js";
import commissionController from "./controller.js";

const router = express.Router();



router
  .post("/create", middleware.authenticate,  commissionController.createCommission)
  .get("/all", middleware.authenticate, commissionController.getAllCommissions)
  .get("/:commissionId", middleware.authenticate, commissionController.getCommissionById)
  .put("/update/:commissionId", middleware.authenticate, commissionController.updateCommission)
  .delete("/delete", middleware.authenticate, commissionController.deleteCommission)
  
  

export default router;
