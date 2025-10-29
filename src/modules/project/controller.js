import ApiError from "../../utils/ApiError.js";
import messages from "../../constants/messages.js";
import { successResponse } from "../../utils/response.helper.js";
import ProService from "./service.js";

const ProController = {
    createProject: async (req, res) => {
        try {
            const data = await ProService.addProject(req.body);
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },

    getAllProjects: async (req, res) => {
        try {
            const data = await ProService.getProjects();
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },

    getProjectById: async (req, res) => {
        try {
            const data = await ProService.getProjectById(req.params.id);
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },

    updateProject: async (req, res) => {
        try {
            const data = await ProService.updateProject(req.params.id, req.body);
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },

    deleteProjectSoft: async (req, res) => {
        try {
            const data = await ProService.deleteProjectSoft(req.params.id);
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },

    deleteAllProjectsSoft: async (req, res) => {
        try {
            const data = await ProService.deleteAllProjectsSoft();
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },

    getDeletedProjects: async (req, res) => {
        try {
            const data = await ProService.getDeletedProjects();
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },

    deleteProjectPermanent: async (req, res) => {
        try {
            const data = await ProService.deleteProjectPermanent(req.params.id);
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },

    deleteAllDeletedProjectsPermanent: async (req, res) => {
        try {
            const data = await ProService.deleteAllDeletedProjectsPermanent();
            successResponse(res, data);
        } catch (err) {
            throw ApiError.badRequest(err.message);
        }
    },
};

export default ProController;
