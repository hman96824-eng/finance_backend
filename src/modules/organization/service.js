import organization from './model.js';
import Repository from '../../utils/repository.js';
import ApiError from '../../utils/ApiError.js';
import messages from '../../constants/messages.js';

const OrganizationRepo = new Repository(organization);

export const saveOrganization = async (data) => {
    try {
        if (data._id) {
            const updatedOrg = await OrganizationRepo.updateById(data._id, data, { new: true });
            if (!updatedOrg) throw ApiError.notFound(messages.ORG_NOT_FOUND);
            return updatedOrg;
        } else {
            return await OrganizationRepo.create(data);
        }
    } catch (error) {
        throw ApiError.internal(error.message || messages.SERVER_ERROR);
    }
};

export const getAllOrganizations = async () => {
    try {
        return await OrganizationRepo.find();
    } catch (error) {
        throw ApiError.internal(messages.SERVER_ERROR);
    }
};

export const getOrganizationById = async (id) => {
    try {
        const org = await OrganizationRepo.findById(id);
        if (!org) throw ApiError.notFound(messages.ORG_NOT_FOUND);
        return org;
    } catch (error) {
        throw ApiError.internal(messages.SERVER_ERROR);
    }
};

export const deleteOrganization = async (id) => {
    try {
        const org = await OrganizationRepo.deleteById(id);
        if (!org) throw ApiError.notFound(messages.ORG_NOT_FOUND);
        return org;
    } catch (error) {
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
