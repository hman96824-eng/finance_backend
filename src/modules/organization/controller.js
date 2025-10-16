import OrgService from './service.js';
import ApiError from '../../utils/ApiError.js';
import messages from '../../constants/messages.js';
import MediaService from "../media/service.js";
import Media from "../media/model.js";

export const createOrUpdateOrganization = async (req, res, next) => {
    try {
        let avatarId = null;
        if (typeof req.body.emails === 'string') {
            req.body.emails = JSON.parse(req.body.emails);
        }
        if (typeof req.body.tags === 'string') {
            req.body.tags = JSON.parse(req.body.tags);
        }
        if (typeof req.body.addresses === 'string' || typeof req.body.address === 'string') {
            req.body.addresses = JSON.parse(req.body.address || req.body.addresses);
        }

        if (req.file) {
            const media = await MediaService.uploadMedia(
                req.file.path,
                "organization_avatars",
                req.user?._id
            );
            avatarId = media._id;
        }

        const orgData = {
            ...req.body,
            ...(avatarId && { avatar: avatarId }),
        };

        const organization = await OrgService.saveOrganization(orgData);

        // changed code: resolve avatar ObjectId -> url before responding
        const organizationWithAvatar = await resolveAvatarFor(organization);

        res.status(200).json({
            success: true,
            message: req.body._id ? messages.ORG_UPDATED : messages.ORG_CREATED,
            data: organizationWithAvatar,
        });
    } catch (error) {
        next(error instanceof ApiError ? error : ApiError.internal(500, error.message));
    }
};


export const getAllOrganizations = async (req, res, next) => {
    try {
        const organizations = await OrgService.getAllOrganizations();
        // changed code: replace avatar ids with urls for each org
        const organizationsWithAvatars = await resolveAvatarsForArray(organizations);

        res.status(200).json({
            success: true,
            message: "Organizations fetched successfully",
            data: organizationsWithAvatars,
        });
    } catch (error) {
        next(ApiError.internal(500, messages.SERVER_ERROR));
    }
};

export const getOrganization = async (req, res, next) => {
    try {
        const organization = await OrgService.getOrganizationById(req.params.id);
        if (!organization) throw ApiError.notFound(messages.ORG_NOT_FOUND);

        // changed code: resolve single org avatar to URL
        const organizationWithAvatar = await resolveAvatarFor(organization);

        res.status(200).json({
            success: true,
            message: "Organization fetched successfully",
            data: organizationWithAvatar,
        });
    } catch (error) {
        next(error instanceof ApiError ? error : ApiError.internal(500, messages.SERVER_ERROR));
    }
};

export const deleteOrganization = async (req, res, next) => {
    try {
        const deleted = await OrgService.deleteOrganization(req.params.id);
        if (!deleted) throw ApiError.notFound(messages.ORG_NOT_FOUND);

        res.status(200).json({
            success: true,
            message: messages.ORG_DELETED,
        });
    } catch (error) {
        next(error instanceof ApiError ? error : ApiError.internal(500, messages.SERVER_ERROR));
    }
};

export const updateOrganization = async (req, res, next) => {
    try {
        const updated = await OrgService.updateOrganization(req.params.id, req.body);
        if (!updated) throw ApiError.notFound(messages.ORG_NOT_FOUND);

        // changed code: resolve avatar after update
        const updatedWithAvatar = await resolveAvatarFor(updated);

        res.status(200).json({
            success: true,
            message: messages.ORG_UPDATED,
            data: updatedWithAvatar,
        });
    } catch (error) {
        next(error instanceof ApiError ? error : ApiError.internal(500, messages.SERVER_ERROR));
    }
};

// helper to replace avatar ObjectId with media.url
const resolveAvatarFor = async (item) => {
    if (!item) return item;
    // ensure plain object
    const obj = item.toObject ? item.toObject() : { ...item };
    const avatarId = obj?.avatar?._id || obj?.avatar || null;
    if (!avatarId) {
        obj.avatar = null;
        return obj;
    }
    const media = await Media.findById(avatarId).lean();
    obj.avatar = media ? media.url : null;
    return obj;
};

const resolveAvatarsForArray = async (arr) => {
    if (!Array.isArray(arr)) return arr;
    return await Promise.all(arr.map(resolveAvatarFor));
};

export default {
    createOrUpdateOrganization,
    getAllOrganizations,
    getOrganization,
    deleteOrganization,
    updateOrganization,
};
