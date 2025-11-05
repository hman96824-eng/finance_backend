import { v2 as cloudinary } from "cloudinary";
import { config } from "./config.js";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const uploadToCloudinary = async (filePath, folder, options = {}) => {
  const uploadOptions = {
    folder: folder || "user_avatars",
    resource_type: options.resource_type || "raw",
  };

  // 1️⃣ Upload first
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "raw",
    folder: "documents",
    use_filename: true,
    unique_filename: false,
    access_mode: "public", // ensures public access
  });

  const viewUrl = result.secure_url.replace("/raw/upload/", "/upload/");
  // 2️⃣ Generate signed URL (useful for PDFs or raw files)
  const signedUrl = cloudinary.url(result.public_id, {
    resource_type: uploadOptions.resource_type,
    type: "upload",
    sign_url: true,
  });

  // 3️⃣ Return both
  return {
    ...result,
    signed_url: signedUrl,
  };
};

export const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};
