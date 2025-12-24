import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloud.js";

// Temporary local storage before uploading to Cloudinary
const tempDir = "./temp_uploads";
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Allowed MIME types for leave attachments
const allowedMimeTypes = [
  // Images
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Spreadsheets
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  // Presentations
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text files
  "text/plain",
];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only image, document, Spreadsheet, PPT, TXT or CSV files are allowed"
      ),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * Middleware to upload leave attachment to Cloudinary
 */
export const uploadLeaveAttachment = [
  upload.single("file"),
  async (req, res, next) => {
    try {
      // If no file uploaded, continue
      if (!req.file) {
        return next();
      }

      // Determine resource type based on mimetype
      let resourceType = "raw"; // default for documents
      if (req.file.mimetype.startsWith("image/")) {
        resourceType = "image";
      } else if (req.file.mimetype.startsWith("video/")) {
        resourceType = "video";
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        req.file.path,
        "leave_attachments", // Cloudinary folder
        { resource_type: resourceType }
      );

      // Delete temporary local file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Store cloudinary data in req for controller to access
      req.cloudinaryFile = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: resourceType,
        format: result.format,
        size: result.bytes,
        originalName: req.file.originalname,
      };

      next();
    } catch (error) {
      // Clean up temp file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  },
];

export { deleteFromCloudinary };
