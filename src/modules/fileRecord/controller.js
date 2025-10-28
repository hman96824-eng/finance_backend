import messages from "../../constants/messages.js";
import { successResponse } from "../../utils/response.helper.js";
import {
  createFileRecordService,
  getAllFileRecordsService,
  updateFileRecordByIdService,
  removeMediaFromRecordService,
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
    const { mediaIds } = req.body;
    const userId = req.user?._id;

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Provide mediaIds array" });
    }

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
