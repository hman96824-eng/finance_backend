import express from "express";
import multer from "multer";
import {
  addFileRecord,
  getAllFileRecords,
  updateFileRecordById,
  deleteMediaFromRecord,
  deleteFileRecordsController,
} from "./controller.js";
import upload from "../../middleware/upload.middleware.js";
import middleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(middleware.authenticate);

// ✅ Routes
router
  .post("/add", upload.array("files", 5), addFileRecord)
  .get("/", getAllFileRecords)
  .put("/:id", upload.array("files", 5), updateFileRecordById)
  .delete("/:recordId/media", deleteMediaFromRecord)
  .delete("/delete-many", deleteFileRecordsController);

// ✅ Centralized Multer Error Handling Middleware
router.use((err, req, res, next) => {
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    // Too many files
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 5 files at once.",
      });
    }

    // File too large
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Each file must be smaller than 10MB.",
      });
    }
  }

  // Invalid file type (from fileFilter)
  if (
    err.message === "Only image, PDF, Word, Excel, and PPT files are allowed"
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Pass any other error to global handler
  next(err);
});

export default router;
