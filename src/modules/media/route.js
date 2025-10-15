import express from "express";
import MediaController from "./controller.js";
import middleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", middleware.authenticate, MediaController.saveMedia);

export default router;
