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
    const userName = req.user?.id; // from auth middleware
    const record = await createFileRecordService(req.body, req.files, userName);
    return successResponse(res, record, messages.FILES_UPLOADED);
  } catch (error) {
    next(error);
  }
};

export const getAllFileRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const data = await getAllFileRecordsService(page, limit, search);
    return successResponse(res, data, messages.FILES_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const updateFileRecordById = async (req, res, next) => {
  try {
    const userId = req.user?.id;
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
