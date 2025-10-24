import Media from "./model.js";
import { uploadToCloudinary } from "../../config/cloud.js";
import ApiError from "../../utils/ApiError.js";
import messages from "../../constants/messages.js";
import fs from "fs";

// import Media from "./model.js";
// import { uploadToCloudinary } from "../../config/cloud.js";
// import ApiError from "../../utils/ApiError.js";
// import messages from "../../constants/messages.js";
// import fs from "fs";

export const uploadMedia = async (filePath, folder = "uploads", uploadedBy = null) => {
    try {
        if (!filePath) return null;

        const uploadResult = await uploadToCloudinary(filePath, folder);

        const media = await Media.create({
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            format: uploadResult.format,
            resource_type: uploadResult.resource_type,
            folder,
            size: uploadResult.bytes,
            uploadedBy,
        });

        // delete temp file
        if (filePath && fs.existsSync(filePath)) await fs.promises.unlink(filePath);

        return media; // return full doc (you’ll get media._id)
    } catch (error) {
        throw ApiError.internal(error.message || messages.MEDIA_UPLOAD_FAILED);
    }
};



export const deleteMedia = async (id) => {
    try {
        const media = await Media.findById(id);
        if (!media) throw ApiError.notFound(messages.MEDIA_NOT_FOUND);

        await deleteFromCloudinary(media.public_id);
        await Media.findByIdAndDelete(id);
        return true;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.internal(error.message || messages.MEDIA_DELETE_FAILED);
    }
};

export default { uploadMedia, deleteMedia };
