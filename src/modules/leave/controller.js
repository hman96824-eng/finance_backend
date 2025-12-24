import LeaveService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const LeaveController = {

    createLeave: async (req, res, next) => {
        try {
            const createdBy = req.user.id;
            const payload = { ...req.body, createdBy };

            const data = await LeaveService.createLeave(payload);

            return successResponse(res, data, "Leave created");
        } catch (err) {
            next(err);
        }
    },

    updateLeave: async (req, res, next) => {
        try {
            const leaveId = req.params.leaveId;
            const updatedBy = req.user.id;

            const payload = { ...req.body, updatedBy };

            const data = await LeaveService.updateLeave(leaveId, payload);

            return successResponse(res, data, "Leave updated");
        } catch (err) {
            next(err);
        }
    },


    getAllLeaves: async (req, res, next) => {
        try {
            const { page, limit, search } = req.query;
            const data = await LeaveService.getAllLeaves(page, limit, search);

            return successResponse(res, data);
        } catch (err) {
            next(err);
        }
    },
    getLeaveById: async (req, res, next) => {
        try {
            const leaveId = req.params.leaveId;

            const data = await LeaveService.getLeaveById(leaveId);

            return successResponse(res, data);
        } catch (err) {
            next(err);
        }
    },

    deleteLeave: async (req, res, next) => {
        try {
            const ids = req.body.ids || [req.params.leaveId];
            const data = await LeaveService.deleteLeave(ids);

            return successResponse(res, data, "Leave(s) deleted");
        } catch (err) {
            next(err);
        }
    }

};

export default LeaveController;
