import DashboardService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const dashboardController = {

    getDashboardSummary: async (req, res, next) => {
        try {
            const { filterType, month, year, range } = req.query;

            console.log("🚀 getDashboardSummary API called with query params:", { filterType, month, year, range });

            const data = await DashboardService.getDashboardSummary({
                filterType, // "month", "year", "all" - if nothing, defaults to current month
                month,      // optional YYYY-MM (e.g., "2025-12" for December 2025)
                year,       // optional YYYY (e.g., "2025")
                range       // optional number of months for "month" filter
            });

            return successResponse(res, data, "Dashboard summary fetched successfully");
        } catch (err) {
            console.error("❌ Error in getDashboardSummary:", err);
            next(err);
        }
    },

    //⭐ Get data for charts (trends: income, expenses, salaries)
    getDashboardCharts: async (req, res, next) => {
        try {
            const { filterType, month, year, startMonth, endMonth, range, currency } = req.query;

            // Default to current month if no relevant query params provided
            const noParams = !filterType && !month && !startMonth && !endMonth && !range;
            const params = { filterType, month, year, startMonth, endMonth, range, currency };
            if (noParams) {
                const now = new Date();
                params.filterType = 'month';
                params.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }

            const data = await DashboardService.getDashboardCharts(params);

            return successResponse(res, data, "Dashboard chart data fetched successfully");
        } catch (err) {
            next(err);
        }
    },

    // // ⭐ Get dashboard data for a specific project
    // getProjectDashboard: async (req, res, next) => {
    //     try {
    //         const { projectId } = req.params;

    //         const data = await DashboardService.getProjectDashboard(projectId);

    //         return successResponse(res, data, "Project dashboard fetched successfully");
    //     } catch (err) {
    //         next(err);
    //     }
    // },

    // // ⭐ Get dashboard data for a specific employee
    // getEmployeeDashboard: async (req, res, next) => {
    //     try {
    //         const { employeeId } = req.params;

    //         const data = await DashboardService.getEmployeeDashboard(employeeId);

    //         return successResponse(res, data, "Employee dashboard fetched successfully");
    //     } catch (err) {
    //         next(err);
    //     }
    // },

    // // ⭐ Get leave statistics
    // getLeaveSummary: async (req, res, next) => {
    //     try {
    //         const { startMonth, endMonth, range } = req.query;

    //         const data = await DashboardService.getLeaveSummary({
    //             startMonth,
    //             endMonth,
    //             range
    //         });

    //         return successResponse(res, data, "Leave summary fetched successfully");
    //     } catch (err) {
    //         next(err);
    //     }
    // }

};

export default dashboardController;