import organization from './model.js';
import Repository from '../../utils/repository.js';
import ApiError from '../../utils/ApiError.js';
import messages from '../../constants/messages.js';

const OrganizationRepo = new Repository(organization);

export const saveOrganization = async (data) => {
    try {
        // changed code: check existence before create / update to avoid duplicates
        // For create - check any org with same name or code
        if (!data._id) {
            const orConditions = [];
            if (data.name) orConditions.push({ name: data.name });
            if (data.code) orConditions.push({ code: data.code });

            if (orConditions.length > 0) {
                const existing = await organization.findOne({ $or: orConditions }).lean();
                if (existing) {
                    throw ApiError.badRequest(messages?.ORG_ALREADY_EXISTS || 'Organization with same name or code already exists');
                }
            }

        }

        // For update - ensure new name/code (if provided) doesn't collide with another org
        if (data._id) {
            const orConditions = [];
            if (data.name) orConditions.push({ name: data.name });
            if (data.code) orConditions.push({ code: data.code });

            if (orConditions.length > 0) {
                const existing = await organization.findOne({
                    $or: orConditions,
                    _id: { $ne: data._id },
                }).lean();
                if (existing) {
                    throw ApiError.badRequest(messages?.ORG_ALREADY_EXISTS || 'Organization with same name or code already exists');
                }
            }

            const updatedOrg = await OrganizationRepo.updateById(data._id, data, { new: true, runValidators: true });
            if (!updatedOrg) throw ApiError.notFound(messages.ORG_NOT_FOUND);
            return updatedOrg;
        }

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.internal(error.message || messages.SERVER_ERROR);
    }
};

export const getAllOrganizations = async () => {
    try {
        return await OrganizationRepo.find();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.internal(messages.SERVER_ERROR);
    }
};

export const getOrganizationById = async (id) => {
    try {
        const org = await OrganizationRepo.findById(id);
        if (!org) throw ApiError.notFound(messages.ORG_NOT_FOUND);
        return org;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.internal(messages.SERVER_ERROR);
    }
};

export const deleteOrganization = async (id) => {
    try {
        const org = await OrganizationRepo.deleteById(id);
        if (!org) throw ApiError.notFound(messages.ORG_NOT_FOUND);
        return org;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.internal(messages.SERVER_ERROR);
    }
};

export const updateOrganization = async (id, data) => {
    try {
        const org = await OrganizationRepo.updateById(id, data, {
            new: true,
            runValidators: true,
        });
        if (!org) throw ApiError.notFound(messages.ORG_NOT_FOUND);
        return org;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.internal(error.message || messages.SERVER_ERROR);
    }
};

export default {
    saveOrganization,
    getAllOrganizations,
    getOrganizationById,
    deleteOrganization,
    updateOrganization,
};
