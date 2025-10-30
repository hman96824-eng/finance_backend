import messages from "../../constants/messages.js";
import ApiError from "../../utils/ApiError.js";
import { successResponse } from "../../utils/response.helper.js";
import {
  createFileRecordService,
  getAllFileRecordsService,
  updateFileRecordByIdService,
  removeMediaFromRecordService,
  deleteFileRecordsService,
} from "./service.js";

export const addFileRecord = async (req, res, next) => {
  try {
    const userId = req.user?._id; // from auth middleware
    const record = await createFileRecordService(req.body, req.files, userId);
    // console.log(record, "record in controller ");

    return successResponse(res, record, messages.FILES_UPLOADED);
  } catch (error) {
    next(error);
  }
};

export const getAllFileRecords = async (req, res, next) => {
  try {
    const records = await getAllFileRecordsService();
    return successResponse(res, records, messages.FILES_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const updateFileRecordById = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const recordId = req.params.id;
    const updatedRecord = await updateFileRecordByIdService(
      recordId,
      req.body,
      req.files,
      userId
    );

    return successResponse(res, updatedRecord, messages.FILES_UPDATED);
  } catch (error) {
    next(error);
  }
};

export const deleteMediaFromRecord = async (req, res, next) => {
  try {
    const recordId = req.params.recordId;
    console.log(req.body, "req.body");

    const { mediaIds } = req.body;
    const userId = req.user?._id;

    if (!Array.isArray(mediaIds) || mediaIds.length === 0)
      throw ApiError.badRequest("Provide mediaIds array");

    const updatedRecord = await removeMediaFromRecordService(
      recordId,
      mediaIds,
      userId
    );

    return successResponse(
      res,
      updatedRecord,
      "Media removed from record successfully"
    );
  } catch (err) {
    next(err);
  }
};
export const deleteFileRecordsController = async (req, res, next) => {
  try {
    const { fileRecordIds } = req.body;

    if (
      !fileRecordIds ||
      !Array.isArray(fileRecordIds) ||
      fileRecordIds.length === 0
    )
      throw ApiError.badRequest("fileRecordIds must be a non-empty array.");
    const result = await deleteFileRecordsService(fileRecordIds);
    return successResponse(
      res,
      "Selected file records deleted successfully.",
      result
    );
  } catch (error) {
    next(error);
  }
};
// export const viewFile = async (req, res) => {
//   try {
//     console.log(req.params, "req.params");

//     const { id } = req.params;
//     console.log(id);

//     const media = await Media.findById(id);
//     console.log(media, "media");

//     if (!media) {
//       return res.status(404).json({ message: "File not found" });
//     }

//     // You can choose between redirect or stream
//     const fileUrl = media.viewUrl;

//     // ✅ Option 1: Simple redirect (best for PDFs)
//     return res.redirect(fileUrl);

//     // ✅ Option 2: Stream (if you want full control)
//     const response = await axios.get(fileUrl, { responseType: "stream" });
//     res.setHeader("Content-Type", response.headers["content-type"]);
//     response.data.pipe(res);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching file" });
//   }
// };

// import * as fileService from "../services/file.service.js";
// import FileRecord from "./";
// import Media from "../";

// export const uploadSingle = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No file provided" });
//     }

//     // destructure fields
//     const { title, description, category, destinationFolder } = req.body;
//     const uploadedBy = req.user?._id || null;

//     // Upload file to Supabase
//     const uploadResult = await fileService.uploadFileToSupabase({
//       buffer: req.file.buffer,
//       originalName: req.file.originalname,
//       contentType: req.file.mimetype,
//       destinationFolder: destinationFolder || "documents",
//     });

//     // ✅ Create Media record in MongoDB
//     const media = await Media.create({
//       url: uploadResult.publicUrl,
//       public_id: uploadResult.path,
//       format: req.file.mimetype.split("/")[1],
//       resource_type: req.file.mimetype.startsWith("image") ? "image" : "raw",
//       folder: destinationFolder || "documents",
//       size: req.file.size,
//       uploadedBy,
//     });

//     // ✅ Create FileRecord and link media
//     const fileRecord = await FileRecord.create({
//       title,
//       description,
//       category,
//       mediaFiles: [media._id],
//       createdBy: uploadedBy,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "File uploaded successfully",
//       data: { fileRecord, media },
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Failed to upload file",
//     });
//   }
// };

// export const uploadMultiple = async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0)
//       return res.status(400).json({ message: "No files provided" });

//     const results = [];
//     for (const f of req.files) {
//       const record = await fileService.uploadFileToSupabase({
//         buffer: f.buffer,
//         originalName: f.originalname,
//         contentType: f.mimetype,
//         destinationFolder: req.body.destinationFolder || "",
//         isPublic:
//           req.body.isPublic !== undefined ? req.body.isPublic === "true" : true,
//         metadata: {},
//       });

//       const publicUrl = record.isPublic
//         ? await fileService.getPublicUrlForPath(record.supabasePath)
//         : null;
//       results.push({ record, publicUrl });
//     }

//     res.status(201).json({ success: true, results });
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ success: false, message: err.message || "Upload failed" });
//   }
// };

// export const getFileRecord = async (req, res) => {
//   try {
//     const record = await FileRecord.findById(req.params.id);
//     if (!record) return res.status(404).json({ message: "Not found" });

//     // Optionally: if private, return signed URL
//     if (!record.isPublic) {
//       const signed = await fileService.createSignedUrl(record.supabasePath);
//       return res.json({ record, url: signed });
//     } else {
//       const publicUrl = await fileService.getPublicUrlForPath(
//         record.supabasePath
//       );
//       return res.json({ record, url: publicUrl });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// export const deleteFile = async (req, res) => {
//   try {
//     const id = req.params.id;
//     await fileService.deleteFile(id);
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// export const listFiles = async (req, res) => {
//   try {
//     const files = await FileRecord.find().sort({ createdAt: -1 }).limit(100);
//     res.json({ files });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
