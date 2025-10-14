import OrgService from './service.js';
import ApiError from '../../utils/ApiError.js';
import messages from '../../constants/messages.js';

export const createOrUpdateOrganization = async (req, res, next) => {
    try {
        const organization = await OrgService.saveOrganization(req.body);
        res.status(200).json({
            success: true,
            message: req.body._id ? messages.ORG_UPDATED : messages.ORG_CREATED,
            data: organization,
        });
    } catch (error) {
        next(error instanceof ApiError ? error : ApiError.internal(500, error.message || messages.SERVER_ERROR));
    }
};

export const getAllOrganizations = async (req, res, next) => {
    try {
        const organizations = await OrgService.getAllOrganizations();
        res.status(200).json({
            success: true,
            message: "Organizations fetched successfully",
            data: organizations,
        });
    } catch (error) {
        next(ApiError.internal(500, messages.SERVER_ERROR));
    }
};

export const getOrganization = async (req, res, next) => {
    try {
        const organization = await OrgService.getOrganizationById(req.params.id);
        if (!organization) throw ApiError.notFound(messages.ORG_NOT_FOUND);

        res.status(200).json({
            success: true,
            message: "Organization fetched successfully",
            data: organization,
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

        res.status(200).json({
            success: true,
            message: messages.ORG_UPDATED,
            data: updated,
        });
    } catch (error) {
        next(error instanceof ApiError ? error : ApiError.internal(500, messages.SERVER_ERROR));
    }
};

export default {
    createOrUpdateOrganization,
    getAllOrganizations,
    getOrganization,
    deleteOrganization,
    updateOrganization,
};
