import OrgService from "./service.js";
import organization from "./model.js";
import Repository from "../../utils/repository.js";
import MediaService from "../media/service.js";
import ApiError from "../../utils/ApiError.js";
import messages from "../../constants/messages.js";
import { get } from "mongoose";

const OrganizationRepo = new Repository(organization); // renamed to avoid confusion

export const createOrUpdateOrganization = async (req, res, next) => {
    try {
        const userId = req.user?._id;

        // 1️⃣ Upload avatar (if provided)
        let media = null;
        if (req.file) {
            media = await MediaService.uploadMedia(req.file.path, "organization-avatars", userId);
        }

        // 2️⃣ Call organization service with body + mediaId
        const result = await OrgService.createOrUpdateOrganization(req.body, media?._id || null, userId);

        // 3️⃣ Send response
        res.status(200).json({
            success: true,
            message: result.created
                ? messages.ORGANIZATION_CREATED || "Organization created successfully"
                : messages.ORGANIZATION_UPDATED || "Organization updated successfully",
            data: result.organization,
        });
    } catch (error) {
        next(error);
    }
};

export const getLatestOrganization = async (req, res, next) => {
    try {
        const org = await OrgService.getLatestOrganization();
        if (!org) {
            return res.status(404).json({
                success: false,
                message: "No organization found",
            });
        }

        res.status(200).json({
            success: true,
            data: org,
        });
    } catch (error) {
        next(error);
    }
};


export default { createOrUpdateOrganization, getLatestOrganization };