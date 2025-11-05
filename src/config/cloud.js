import { v2 as cloudinary } from "cloudinary";
import { config } from "./config.js";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Upload file to Cloudinary (default: resource_type=raw, folder=documents)
 */
export const uploadToCloudinary = async (
  filePath,
  folder = "documents",
  options = {}
) => {
  try {
    const uploadOptions = {
      folder,
      resource_type: options.resource_type || "raw",
      use_filename: true,
      unique_filename: false,
      access_mode: "public",
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Generate a viewable URL (for raw files)
    const viewUrl = result.secure_url.replace("/raw/upload/", "/upload/");

    // Generate a signed URL
    const signedUrl = cloudinary.url(result.public_id, {
      resource_type: uploadOptions.resource_type,
      type: "upload",
      sign_url: true,
    });

    return {
      ...result,
      signed_url: signedUrl,
      view_url: viewUrl,
    };
  } catch (err) {
    console.error("❌ Cloudinary upload failed:", err.message);
    throw err;
  }
};

/**
 * Delete file from Cloudinary with full logging & type awareness
 */
export const deleteFromCloudinary = async (publicId, resourceType = "raw") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "not found") {
      console.warn("⚠️ File not found on Cloudinary:", publicId);
    }

    return result;
  } catch (err) {
    console.error("❌ Cloudinary delete error:", err.message);
    throw err;
  }
};
