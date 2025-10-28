// routes/fileRecord.route.js
import express from "express";
import {
  addFileRecord,
  getAllFileRecords,
  updateFileRecordById,
  deleteMediaFromRecord,
} from "./controller.js";
import upload from "../../middleware/upload.middleware.js";
import middleware from "../../middleware/auth.middleware.js";

const router = express.Router();
router.use(middleware.authenticate);
// upload multiple files (any type)
router
  .post("/add", upload.array("files", 5), addFileRecord)
  .get("/", getAllFileRecords)
  .put("/:id", upload.array("files", 5), updateFileRecordById)
  .delete("/:recordId/media", deleteMediaFromRecord);

export default router;
