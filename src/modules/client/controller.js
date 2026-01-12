import ApiError from "../../utils/ApiError.js";
import ClientService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

export const addClient = async (req, res, next) => {
    try {
        const client = await ClientService.addClient(req.body);
        return successResponse(res, client, "Client added successfully");
    } catch (error) {
        next(error);
    }
};

export const updateClient = async (req, res, next) => {
    try {
        const client = await ClientService.updateClient(req.params.id, req.body);
        return successResponse(res, client, "Client updated successfully");
    } catch (error) {
        next(error);
    }
};

export const getAllClients = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const result = await ClientService.getAllClients(page, limit, search);

        return successResponse(res, result, "Clients fetched successfully");
    } catch (error) {
        next(error);
    }
};

export const deleteClient = async (req, res, next) => {
    try {
        await ClientService.deleteClient(req.params.id);
        return successResponse(res, null, "Client deleted successfully");
    } catch (error) {
        next(error);
    }
};

export const bulkDeleteClients = async (req, res, next) => {
    try {
        const { ids } = req.body;
        await ClientService.bulkDeleteClients(ids);
        return successResponse(res, null, "Clients deleted successfully");
    } catch (error) {
        next(error);
    }
};
