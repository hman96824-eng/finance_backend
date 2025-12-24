import SalaryService from "./service.js";
import { successResponse } from "../../../utils/response.helper.js";
import { AccountingPeriodModel } from "../../period/model.js";

const SalaryController = {
    createSalary: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const activePeriod = await AccountingPeriodModel.findOne({ status: "open" });
            if (!activePeriod) {
                return res.status(404).json({ message: "No active month found" });
            }

            // 2. Attach accountingPeriod to payload
            const payload = {
                ...req.body,
                createdBy: userId,
                accountingPeriod: activePeriod._id
            };

            const result = await SalaryService.createSalary(payload);
            return successResponse(res, result, "Salary added successfully");
        } catch (err) {
            next(err);
        }
    },

    deleteSalary: async (req, res, next) => {
        try {
            const result = await SalaryService.deleteSalary(req.params.id);
            return successResponse(res, result, "Salary deleted permanently");
        } catch (err) { next(err); }
    },

    deleteManySalary: async (req, res, next) => {
        try {
            const result = await SalaryService.deleteMany(req.body.ids);
            return successResponse(res, result, "Salaries deleted permanently");
        } catch (err) { next(err); }
    },

    getAllSalaries: async (req, res, next) => {
        try {
            // Fetch Active Period ID to filter salaries
            // If user explicitly asks for 'history' (via query param?) we could skip this.
            // But based on request, assume default view is for current period.
            // Use accountingPeriod from middleware
            const accountingPeriod = req.accountingPeriod;

            if (!accountingPeriod) return successResponse(res, []);

            const data = await SalaryService.getAllSalaries(accountingPeriod);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },

    getSalaryById: async (req, res, next) => {
        try {
            const data = await SalaryService.getSalaryById(req.params.id);
            return successResponse(res, data);
        } catch (err) { next(err); }
    },

    getSalaryByEmployee: async (req, res, next) => {
        try {
            // Can accept employeeId or email
            const identifier = req.params.identifier;
            const data = await SalaryService.getSalaryByEmployee(identifier);
            return successResponse(res, data, "Salary records retrieved successfully");
        } catch (err) { next(err); }
    },

    getMySalaryInfo: async (req, res, next) => {
        try {
            console.log('🎯 Controller: getMySalaryInfo called');
            console.log('📧 User email from token:', req.user?.email);
            console.log('🔢 Query params:', req.query);
            
            // Get employeeId from query params (optional)
            const employeeId = req.query.employeeId;
            
            // Get email from query params or from JWT token
            const emailFromQuery = req.query.email;
            const userEmail = emailFromQuery || req.user?.email;
            
            console.log('🔍 Final search params:', { employeeId, userEmail });

            if (!employeeId && !userEmail) {
                return res.status(400).json({ 
                    message: "Employee ID or email is required" 
                });
            }

            const data = await SalaryService.getMySalaryInfo(employeeId, userEmail);
            return successResponse(res, data, "Salary information retrieved successfully");
        } catch (err) { 
            console.error('❌ Controller Error:', err);
            next(err); 
        }
    }
};

export default SalaryController;
