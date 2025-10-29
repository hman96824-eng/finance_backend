import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    format: { type: String },
    resource_type: { type: String, enum: ["image", "raw", "auto"] },
    folder: { type: String, default: "uploads" },
    size: { type: Number }, // bytes
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

const Media = mongoose.model("Media", MediaSchema);
export default Media;
