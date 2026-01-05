import Client from "./model.js";
import ApiError from "../../utils/ApiError.js";
import { successResponse } from "../../utils/response.helper.js";

export const addClient = async (req, res, next) => {
    try {
        const client = await Client.create(req.body);
        return successResponse(res, client, "Client added successfully");
    } catch (error) {
        next(error);
    }
};

export const updateClient = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!client) {
            throw ApiError.notFound("Client not found");
        }
        return successResponse(res, client, "Client updated successfully");
    } catch (error) {
        next(error);
    }
};

export const getAllClients = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { clientName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { companyName: { $regex: search, $options: "i" } },
            ];
        }

        const clients = await Client.find(query)
            .populate("projectId", "projectName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Client.countDocuments(query);

        return successResponse(
            res,
            {
                clients,
                pagination: {
                    total,
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    pageSize: Number(limit),
                },
            },
            "Clients fetched successfully"
        );
    } catch (error) {
        next(error);
    }
};

export const deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true }
        );
        if (!client) {
            throw ApiError.notFound("Client not found");
        }
        return successResponse(res, null, "Client deleted successfully");
    } catch (error) {
        next(error);
    }
};

export const bulkDeleteClients = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            throw ApiError.badRequest("Invalid IDs provided");
        }
        await Client.updateMany(
            { _id: { $in: ids } },
            { isDeleted: true }
        );
        return successResponse(res, null, "Clients deleted successfully");
    } catch (error) {
        next(error);
    }
};
