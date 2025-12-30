import { LeaveModel } from "../leave/model.js";
import { EmployeeModel } from "../employee/model.js";
import SalaryExpense from "../expenses/salary/model.js";
import { FeedbackModel } from "../feedback/model.js";
import ApiError from "../../utils/ApiError.js";

class UserDashboardService {
  /**
   * Get user dashboard data including leave, salary, and feedback
   */
  static getUserDashboard = async (userEmail) => {
    try {
      // Find employee by email
      const employee = await EmployeeModel.findOne({ email: userEmail });
      
      if (!employee) {
        throw ApiError.notFound(
          "Employee record not found. Please contact admin to create your employee profile."
        );
      }

      // Fetch Leave Data
      let leaveData = await LeaveModel.findOne({ employeeId: employee._id })
        .populate("employeeId", "name email employeeCode")
        .populate("leaves.createdBy", "name")
        .populate("leaves.approvedBy", "name")
        .populate("leaves.noteBy", "name");

      // If no leave record exists, create default structure
      if (!leaveData) {
        leaveData = {
          employeeId: employee,
          leaves: [],
          history: [],
          annualLeaveBalance: 18,
          lastResetYear: new Date().getFullYear(),
        };
      }

      // Calculate leave statistics
      const pendingLeaves = leaveData.leaves?.filter(l => l.status === "PENDING") || [];
      const approvedLeaves = leaveData.leaves?.filter(l => l.status === "APPROVED") || [];
      const rejectedLeaves = leaveData.leaves?.filter(l => l.status === "REJECTED") || [];
      
      const totalPendingDays = pendingLeaves.reduce((sum, l) => sum + l.totalDays, 0);
      const totalApprovedDays = approvedLeaves.reduce((sum, l) => sum + l.totalDays, 0);

      // Fetch Salary Data
      const salaryData = await SalaryExpense.findOne({ 
        employeeId: employee.employeeCode,
        isDeleted: false 
      });

      // Calculate salary statistics
      let salaryStats = {
        totalSalaries: 0,
        latestSalary: null,
        totalEarnings: 0,
        averageSalary: 0,
      };

      if (salaryData && salaryData.salaries && salaryData.salaries.length > 0) {
        salaryStats.totalSalaries = salaryData.salaries.length;
        
        // Get latest salary (last in array)
        salaryStats.latestSalary = salaryData.salaries[salaryData.salaries.length - 1];
        
        // Calculate total earnings
        salaryStats.totalEarnings = salaryData.salaries.reduce(
          (sum, s) => sum + (s.netSalary || 0), 
          0
        );
        
        // Calculate average salary
        salaryStats.averageSalary = Math.round(
          salaryStats.totalEarnings / salaryStats.totalSalaries
        );
      }

      // Fetch Feedback Data (sent by this user)
      const feedbacks = await FeedbackModel.find({ 
        email: userEmail 
      })
        .sort({ createdAt: -1 })
        .select("-__v");

      // Calculate feedback statistics
      const pendingFeedbacks = feedbacks.filter(f => f.status === "pending");
      const reviewedFeedbacks = feedbacks.filter(f => f.status === "reviewed");
      const resolvedFeedbacks = feedbacks.filter(f => f.status === "resolved");

      // Build response
      return {
        employee: {
          _id: employee._id,
          name: employee.name,
          email: employee.email,
          employeeCode: employee.employeeCode,
          designation: employee.department?.designation,
          department: employee.department?.departmentName,
          phone: employee.phone,
          status: employee.status,
        },
        
        leave: {
          annualLeaveBalance: leaveData.annualLeaveBalance || 18,
          lastResetYear: leaveData.lastResetYear || new Date().getFullYear(),
          statistics: {
            totalLeaves: leaveData.leaves?.length || 0,
            pendingLeaves: pendingLeaves.length,
            approvedLeaves: approvedLeaves.length,
            rejectedLeaves: rejectedLeaves.length,
            totalPendingDays,
            totalApprovedDays,
          },
          recentLeaves: (leaveData.leaves || []).slice(0, 5), // Last 5 leaves
          history: leaveData.history || [],
        },

        salary: {
          statistics: salaryStats,
          employeeDetails: salaryData ? {
            employeeName: salaryData.employeeName,
            employeeId: salaryData.employeeId,
            designation: salaryData.designation,
            department: salaryData.department,
          } : null,
          recentSalaries: salaryData?.salaries?.slice(-5) || [], // Last 5 salary records
        },

        feedback: {
          statistics: {
            total: feedbacks.length,
            pending: pendingFeedbacks.length,
            reviewed: reviewedFeedbacks.length,
            resolved: resolvedFeedbacks.length,
          },
          recentFeedbacks: feedbacks.slice(0, 5), // Last 5 feedbacks
        },

        summary: {
          leavesUsed: totalApprovedDays,
          leavesRemaining: leaveData.annualLeaveBalance || 18,
          salariesReceived: salaryStats.totalSalaries,
          feedbacksSubmitted: feedbacks.length,
          latestSalaryAmount: salaryStats.latestSalary?.netSalary || 0,
          latestSalaryMonth: salaryStats.latestSalary?.salaryMonth || null,
        },
      };
    } catch (error) {
      throw error;
    }
  };
}

export default UserDashboardService;
