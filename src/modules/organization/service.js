import Organization from './model.js';
import Repository from '../../utils/repository.js';
import ApiError from '../../utils/ApiError.js';
import messages from '../../constants/messages.js';

const OrganizationRepo = new Repository(Organization);

export const createOrUpdateOrganization = async (orgData, mediaId, userId) => {
    const {
        name,
        code,
        size,
        emails,
        phone,
        website,
        description,
        tags,
        addresses,
    } = orgData;

    try {
        // check if organization already exists
        const existingOrg = await Organization.findOne({ name });

        if (existingOrg) {
            // update existing org
            existingOrg.code = code ?? existingOrg.code;
            existingOrg.size = size ?? existingOrg.size;
            existingOrg.emails = emails ?? existingOrg.emails;
            existingOrg.phone = phone ?? existingOrg.phone;
            existingOrg.website = website ?? existingOrg.website;
            existingOrg.description = description ?? existingOrg.description;
            existingOrg.tags = tags ?? existingOrg.tags;
            existingOrg.addresses = addresses ?? existingOrg.addresses;
            if (mediaId) existingOrg.avatar = mediaId;

            try {
                await existingOrg.save();
            } catch (err) {
                // handle mongo duplicate key on update
                if (err && err.code === 11000) {
                    const dupField = Object.keys(err.keyValue || {})[0] || 'field';
                    // use message component; specific message for code if present
                    if (dupField === 'code') throw ApiError.badRequest(messages.ORG_CODE_EXISTS || `${messages.DUPLICATE_FIELD}: ${dupField}`);
                    throw ApiError.badRequest(`${messages.DUPLICATE_FIELD}: ${dupField}`);
                }
                if (err instanceof ApiError) throw err;
                throw ApiError.internal(messages.SERVER_ERROR);
            }

            return { updated: true, organization: existingOrg };
        }

        // create new organization
        try {
            const newOrg = await Organization.create({
                name,
                code,
                size,
                emails,
                phone,
                website,
                description,
                tags,
                avatar: mediaId || null,
                addresses,
            });
            return { created: true, organization: newOrg };
        } catch (err) {
            // handle duplicate key on create (E11000)
            if (err && err.code === 11000) {
                const dupField = Object.keys(err.keyValue || {})[0] || 'field';
                if (dupField === 'code') throw ApiError.badRequest(messages.ORG_CODE_EXISTS || `${messages.DUPLICATE_FIELD}: ${dupField}`);
                // if name duplicate, use existing message constant
                if (dupField === 'name') throw ApiError.badRequest(messages.ORG_ALREADY_EXISTS || `${messages.DUPLICATE_FIELD}: ${dupField}`);
                throw ApiError.badRequest(`${messages.DUPLICATE_FIELD}: ${dupField}`);
            }
            if (err instanceof ApiError) throw err;
            throw ApiError.internal(messages.SERVER_ERROR);
        }
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.internal(messages.SERVER_ERROR);
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

export const getLatestOrganization = async () => {
    const org = await Organization.findOne()
        .sort({ createdAt: -1 })   // 👈 latest organization
        .populate("avatar")        // 👈 include image info
        .populate("addresses");    // optional, if addresses are stored separately

    return org;
};

export default {
    createOrUpdateOrganization,
    getAllOrganizations,
    getLatestOrganization,
};
