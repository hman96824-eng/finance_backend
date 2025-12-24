import ApiError from "../../utils/ApiError.js";
import messages from "../../constants/messages.js";
import { successResponse } from "../../utils/response.helper.js";
import ProService from "./service.js";

const ProController = {
  createProject: async (req, res) => {
    try {
      const data = await ProService.addProject(req.body, req.user?._id);

      successResponse(res, data, "Project Created Successfully");
    } catch (err) {
      throw ApiError.badRequest(err.message);
    }
  },

  getAllProjects: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const data = await ProService.getProjects(page, limit, search);
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
      const projectId = req.params.id;
      const data = req.body;

      const updatedProject = await ProService.updateProject(projectId, data);

      successResponse(res, updatedProject, "Project Updated Successfully");
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

  deleteAllProjects: async (req, res, next) => {
    try {
      const projectIds = req.body; // array of IDs
      const result = await ProService.softDeleteManyProjects(projectIds);

      return successResponse(res, result, "Project Deleted Successfully");
    } catch (err) {
      next(err);
    }
  },

  getDeletedProjects: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const data = await ProService.getDeletedProjects(page, limit, search);
      successResponse(res, data);
    } catch (err) {
      throw ApiError.badRequest(err.message);
    }
  },

  deleteProjectPermanent: async (req, res) => {
    try {
      const data = await ProService.deleteProjectPermanent(req.params.id);
      successResponse(res, data, "Project Deleted Successfully");
    } catch (err) {
      throw ApiError.badRequest(err.message);
    }
  },

  deleteAllDeletedProjectsPermanent: async (req, res) => {
    try {
      const projectIDs = req.body; // ✅ now this will contain your array
      const data = await ProService.deleteAllDeletedProjectsPermanent(
        projectIDs
      );
      successResponse(res, data, "Project Deleted Successfully");
    } catch (err) {
      throw ApiError.badRequest(err.message);
    }
  },
};

export default ProController;
