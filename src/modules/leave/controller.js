import LeaveService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const LeaveController = {

    createLeave: async (req, res, next) => {
        try {
            const createdBy = req.user.id;
            const userEmail = req.user.email; // From JWT token
            const isAdminCreating = req.user.role === "ADMIN" || req.user.role === "Admin";
            
            // Get attachment from Cloudinary upload OR from body (URL string)
            let attachment = null;
            
            if (req.cloudinaryFile) {
                // File was uploaded to Cloudinary
                attachment = {
                    url: req.cloudinaryFile.url,
                    publicId: req.cloudinaryFile.publicId,
                    resourceType: req.cloudinaryFile.resourceType,
                    originalName: req.cloudinaryFile.originalName,
                    size: req.cloudinaryFile.size
                };
            } else if (req.body.file || req.body.attachment) {
                // URL string provided directly
                attachment = {
                    url: req.body.file || req.body.attachment,
                    publicId: null,
                    resourceType: 'url',
                    originalName: 'External URL',
                    size: 0
                };
            }
            
            const payload = { 
                ...req.body, 
                createdBy,
                userEmail,
                isAdminCreating,
                attachment 
            };

            const data = await LeaveService.createLeave(payload);

            return successResponse(res, data, "Leave request created successfully");
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

    getMyLeaveInfo: async (req, res, next) => {
        try {
            console.log('📥 Received leave info request:', req.query);
            console.log('👤 User from JWT:', req.user);
            
            // Get employeeId or email from query params, or use JWT email as fallback
            const employeeId = req.query.employeeId;
            const emailFromQuery = req.query.email;
            const userEmail = emailFromQuery || req.user?.email; // Prefer query param, fallback to JWT

            console.log('🔍 Looking for employee with:', { employeeId, userEmail });

            const data = await LeaveService.getMyLeaveInfo(employeeId, userEmail);

            return successResponse(res, data, "Leave information retrieved successfully");
        } catch (err) {
            console.error('❌ Error in getMyLeaveInfo controller:', err);
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
