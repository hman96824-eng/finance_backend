// models/fileRecord.model.js
import mongoose from "mongoose";

const FileRecordSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    mediaFiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("FileRecord", FileRecordSchema);
