import fs from "fs";
import Media from "../media/model.js";
import FileRecord from "./modal.js";
import { uploadToCloudinary } from "../../config/cloud.js";
import ApiError from "../../utils/ApiError.js";
import { deleteFromCloudinary } from "../../config/cloud.js";
import mongoose from "mongoose";

export const createFileRecordService = async (data, files, user) => {
  const { title, description, category } = data;

  // Validate user ID
  if (!user || !mongoose.Types.ObjectId.isValid(user)) {
    throw ApiError.badRequest("Invalid user ID provided");
  }

  // ✅ 1. Validate number of files
  if (!files || files.length === 0) {
    throw ApiError.badRequest("No files provided for upload.");
  }

  if (files.length > 5) {
    files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    throw ApiError.badRequest("You can upload a maximum of 5 files at once.");
  }

  const uploadedMedia = [];

  try {
    for (const file of files) {
      // ✅ 2. Validate file size (10MB limit)
      const maxFileSize = 10 * 1024 * 1024; //10 MB
      if (file.size > maxFileSize) {
        files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        throw ApiError.badRequest(
          `File "${file.originalname}" exceeds the 10MB limit.`
        );
      }

      // ✅ 3. Upload file to Cloudinary
      const result = await uploadToCloudinary(file.path, "documents");

      // ✅ 4. Save media record in DB with ObjectId
      const media = await Media.create({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        folder: result.folder,
        size: result.bytes,
        uploadedBy: new mongoose.Types.ObjectId(user), // Convert to ObjectId
      });

      uploadedMedia.push(media._id);

      // ✅ 5. Delete local temp file
      fs.unlinkSync(file.path);
    }

    // Create FileRecord with the user ID
    const record = new FileRecord({
      title,
      description,
      category,
      mediaFiles: uploadedMedia,
      createdBy: new mongoose.Types.ObjectId(user), // Also ensure createdBy is ObjectId
    });

    await record.save();

    //     // ✅ 7. Populate data (cleanest + most reliable)
    const populatedRecord = await FileRecord.findById(record._id)
      .populate({
        path: "mediaFiles",
        select:
          "url format resource_type folder size uploadedBy createdAt updatedAt",
      })
      .populate({ path: "createdBy", select: "name email role" })
      .lean(); // convert to plain JS object for safe JSON response

    //     // ✅ 8. Add backend-based view URLs
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
    populatedRecord.mediaFiles = populatedRecord.mediaFiles.map((m) => {
      return {
        ...(m.toObject?.() || m), // ensure it's a plain object if it's a Mongoose doc
        viewUrl: `${BASE_URL}/api/v1/files/view/${m._id}`,
      };
    });

    return populatedRecord;
  } catch (error) {
    //     // Cleanup local files in case of failure
    files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    throw ApiError.internal(error.message || "File upload failed.");
  }
};

export const getAllFileRecordsService = async (page = 1, limit = 10) => {
  const skip = (Number(page) - 1) * Number(limit);
  const records = await FileRecord.find()
    .populate([
      {
        path: "mediaFiles",
        select:
          "url format resource_type folder size uploadedBy createdAt updatedAt",
        populate: {
          path: "uploadedBy",
          select: "name email role",
        },
      },
      {
        path: "createdBy",
        select: "name email role",
      },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await FileRecord.countDocuments();

  return {
    records,
    pagination: {
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      pageSize: Number(limit),
    },
  };
};

// ✅ Update file record and append new files (files only)
export const updateFileRecordByIdService = async (
  recordId,
  _data,
  files,
  userId
) => {
  // Validate user ID first
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid user ID provided");
  }

  const record = await FileRecord.findById(recordId);
  if (!record) throw ApiError.notFound("File record not found.");

  const uploadedMedia = [];

  // ✅ Handle new files (if any)
  if (files && files.length > 0) {
    // Limit: Max 5 files per update
    if (files.length > 5) {
      files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      throw ApiError.badRequest("You can upload a maximum of 5 files at once.");
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

    try {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
          throw ApiError.badRequest(
            `File "${file.originalname}" exceeds the 10MB limit.`
          );
        }

        // ✅ Upload to Cloudinary
        const result = await uploadToCloudinary(file.path, "documents");

        const media = await Media.create({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          folder: result.folder,
          size: result.bytes,
          uploadedBy: new mongoose.Types.ObjectId(userId), // Convert to ObjectId
        });

        uploadedMedia.push(media._id);

        // Remove temp file after upload
        fs.existsSync(file.path) && fs.unlinkSync(file.path);
      }

      // ✅ Append new files to existing array
      record.mediaFiles = [...record.mediaFiles, ...uploadedMedia];
    } catch (error) {
      console.error("DEBUG: File update error:", error);
      // Cleanup any remaining temp files
      files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      const errMsg = error.message || JSON.stringify(error);
      throw ApiError.internal(`DEBUG: ${errMsg}`);
    }
  }

  await record.save();

  // ✅ Populate media + creator info before returning
  const populatedRecord = await FileRecord.findById(record._id)
    .populate([
      {
        path: "mediaFiles",
        select:
          "url format resource_type folder size uploadedBy createdAt updatedAt",
        populate: { path: "uploadedBy", select: "name email role" },
      },
      { path: "createdBy", select: "name email role" },
    ])
    .lean();

  // Add viewUrl to each media file
  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
  populatedRecord.mediaFiles = populatedRecord.mediaFiles.map((m) => ({
    ...m,
    viewUrl: `${BASE_URL}/api/v1/files/view/${m._id}`,
  }));

  return populatedRecord;
};

export const removeMediaFromRecordService = async (
  recordId,
  mediaIds,
  userId
) => {
  if (!mongoose.Types.ObjectId.isValid(recordId)) {
    throw ApiError.badRequest("Invalid recordId");
  }

  // Ensure each mediaId is valid
  const invalid = mediaIds.some((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalid) throw ApiError.badRequest("One or more mediaIds are invalid");

  // Find the record and its current mediaFiles
  const record = await FileRecord.findById(recordId).populate("mediaFiles");
  if (!record) throw ApiError.notFound("FileRecord not found");

  // Make sure requested mediaIds are actually part of this record
  const currentMediaIds = record.mediaFiles.map((m) => String(m._id));
  const notBelonging = mediaIds.filter(
    (id) => !currentMediaIds.includes(String(id))
  );
  if (notBelonging.length > 0) {
    // either skip or throw — here we throw to be explicit
    throw ApiError.badRequest(
      `Media ids not part of the record: ${notBelonging.join(", ")}`
    );
  }

  // Gather Media docs to delete (with public_id)
  const mediaDocs = await Media.find({ _id: { $in: mediaIds } });

  // Delete files from Cloudinary. If an individual deletion fails, log and continue.
  for (const m of mediaDocs) {
    try {
      // deleteFromCloudinary should handle public id for raw/image/video
      await deleteFromCloudinary(m.public_id);
    } catch (err) {
      console.error(
        `Cloudinary deletion failed for ${m._id} / ${m.public_id}:`,
        err.message
      );
      // continue — we still remove DB references to avoid orphaning in UI.
    }
  }

  // Remove Media documents from DB
  await Media.deleteMany({ _id: { $in: mediaIds } });

  // Pull removed media IDs from the FileRecord.mediaFiles array
  await FileRecord.findByIdAndUpdate(
    recordId,
    {
      $pull: { mediaFiles: { $in: mediaIds } },
    },
    { new: true }
  );

  // Return the updated populated record
  const updatedRecord = await FileRecord.findById(recordId).populate([
    {
      path: "mediaFiles",
      select: "url format resource_type folder size uploadedBy createdAt",
    },
    { path: "createdBy", select: "name email role" },
  ]);

  return updatedRecord;
};

export const deleteFileRecordsService = async (fileRecordIds) => {
  const deleted = [];

  for (const id of fileRecordIds) {
    const fileRecord = await FileRecord.findById(id).populate("mediaFiles");

    if (!fileRecord) continue;

    // 🧹 Delete each media file from Cloudinary + DB
    for (const media of fileRecord.mediaFiles) {
      if (media.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(media.cloudinaryPublicId);
        } catch (err) {
          console.error(`❌ Failed to delete from Cloudinary: ${err.message}`);
        }
      }

      await Media.findByIdAndDelete(media._id);
    }

    // 🧹 Delete the FileRecord itself
    await FileRecord.findByIdAndDelete(id);
    deleted.push(id);
  }

  return { deletedCount: deleted.length, deletedIds: deleted };
};
