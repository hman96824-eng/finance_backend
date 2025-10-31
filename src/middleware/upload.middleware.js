// import multer from "multer";
// import path from "path";
// import fs from "fs";

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const dir = "./uploads";
//         if (!fs.existsSync(dir)) fs.mkdirSync(dir);
//         cb(null, dir);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     },
// });

// const upload = multer({
//     storage,
//     fileFilter: (req, file, cb) => {
//         const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
//         if (!allowed.includes(file.mimetype)) {
//             return cb(new Error("Only image files allowed"));
//         }
//         cb(null, true);
//     },
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
// });

// export default upload;

import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// ✅ Allowed MIME types (images + docs + presentations + spreadsheets)
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

  // Presentations
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

// File filter function
const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only image, PDF, Word, Excel, and PPT files are allowed"),
      false
    );
  }
  cb(null, true);
};

// ✅ Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB per file
});

export default upload;
