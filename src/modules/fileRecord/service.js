// services/fileRecord.service.js
import fs from "fs";
import Media from "../media/model.js";
import FileRecord from "./modal.js";
import { uploadToCloudinary } from "../../config/cloud.js";
import ApiError from "../../utils/ApiError.js";
import { deleteFromCloudinary } from "../../config/cloud.js";
import mongoose from "mongoose";
import messages from "../../constants/messages.js";

export const createFileRecordService = async (data, files, userId) => {
  const { title, description, category } = data;

  // ✅ 1. Validate number of files
  if (!files || files.length === 0) {
    throw ApiError.badRequest("No files provided for upload.");
  }

  if (files.length > 5) {
    // cleanup any temp files already written
    files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    throw ApiError.badRequest("You can upload a maximum of 5 files at once.");
  }

  const uploadedMedia = [];

  for (const file of files) {
    // ✅ 2. Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10 MB in bytes
    if (file.size > maxFileSize) {
      // cleanup all temp files
      files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      throw ApiError.badRequest(
        `File "${file.originalname}" exceeds the 10MB limit.`
      );
    }

    // ✅ 3. Upload file to Cloudinary
    const result = await uploadToCloudinary(file.path, "documents");

    // ✅ 4. Save media record
    const media = await Media.create({
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
      folder: result.folder,
      size: result.bytes,
      uploadedBy: userId,
    });

    uploadedMedia.push(media._id);

    // ✅ 5. Delete local temp file
    fs.unlinkSync(file.path);
  }

  // ✅ 6. Create FileRecord
  const record = await FileRecord.create({
    title,
    description,
    category,
    mediaFiles: uploadedMedia,
    createdBy: userId,
  });

  // ✅ 7. Populate related data for response
  await record.populate([
    {
      path: "mediaFiles",
      select:
        "url format resource_type folder size uploadedBy createdAt updatedAt",
    },
    { path: "createdBy", select: "name email role" },
  ]);

  return record;
};

export const getAllFileRecordsService = async () => {
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
    .sort({ createdAt: -1 }); // latest first

  return records;
};

// ✅ Update file record and append new files
export const updateFileRecordByIdService = async (
  recordId,
  data,
  files,
  userId
) => {
  const record = await FileRecord.findById(recordId);
  if (!record) throw ApiError.notFound("File record not found.");

  // Update title/description if provided
  if (data.title) record.title = data.title;
  if (data.description) record.description = data.description;

  const uploadedMedia = [];

  // Handle new files (if any)
  if (files && files.length > 0) {
    if (files.length > 5) {
      files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      throw ApiError.badRequest("You can upload a maximum of 5 files at once.");
    }

    for (const file of files) {
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSize) {
        files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        throw ApiError.badRequest(
          `File "${file.originalname}" exceeds the 10MB limit.`
        );
      }

      const result = await uploadToCloudinary(file.path, "documents");

      const media = await Media.create({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        folder: result.folder,
        size: result.bytes,
        uploadedBy: userId,
      });

      uploadedMedia.push(media._id);

      fs.unlinkSync(file.path);
    }

    // Append new media IDs to existing array
    record.mediaFiles = [...record.mediaFiles, ...uploadedMedia];
  }

  await record.save();

  await record.populate([
    {
      path: "mediaFiles",
      select:
        "url format resource_type folder size uploadedBy createdAt updatedAt",
      populate: { path: "uploadedBy", select: "name email role" },
    },
    { path: "createdBy", select: "name email role" },
  ]);

  return record;
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
