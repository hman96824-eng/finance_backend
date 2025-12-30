import UserDashboardService from "./service.js";
import { successResponse } from "../../utils/response.helper.js";

const UserDashboardController = {
  /**
   * Get current user's dashboard data
   */
  getUserDashboard: async (req, res, next) => {
    try {
      const userEmail = req.user.email; // From JWT token
      
      const data = await UserDashboardService.getUserDashboard(userEmail);
      
      return successResponse(res, data, "User dashboard data retrieved successfully");
    } catch (err) {
      next(err);
    }
  },
};

export default UserDashboardController;
