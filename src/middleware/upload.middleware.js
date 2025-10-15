import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "./uploads";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Only image files allowed"));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;
