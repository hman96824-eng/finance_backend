import MediaService from "./service.js";
import ApiError from "../../utils/ApiError.js";

export const uploadMedia = async (req, res, next) => {
    try {
        if (!req.file) throw ApiError.badRequest("No file uploaded");

        const folder = req.body.folder || "organization_avatars";
        const uploadedBy = req.user?._id || null;

        const media = await MediaService.uploadMedia(req.file.path, folder, uploadedBy);

        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: media,
        });
    } catch (error) {
        next(error instanceof ApiError ? error : ApiError.internal(500, error.message));
    }
};

export default uploadMedia