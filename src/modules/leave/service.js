import { LeaveModel } from "./model.js";
import { EmployeeModel } from "../employee/model.js";
import { deleteFromCloudinary } from "../../config/cloud.js";

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
function normalizeDate(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function calcDays(start, end) {
  const s = normalizeDate(start);
  const e = normalizeDate(end);

  return Math.ceil((e - s) / 86400000) + 1; 
}

function splitLeaveByMonth(startDate, endDate) {
  const result = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    const monthKey = current.toISOString().slice(0, 7);

    const endOfMonth = new Date(
      current.getFullYear(),
      current.getMonth() + 1,
      0
    );

    const monthEnd = endDate < endOfMonth ? endDate : endOfMonth;
    const days = calcDays(current, monthEnd);

    result.push({ month: monthKey, days });

    current = new Date(monthEnd);
    current.setDate(current.getDate() + 1);
  }

  return result;
}
function countLeavesInMonth(leaves, month) {
  return leaves.filter(leave => {
    if (leave.status !== "APPROVED" && leave.status !== "PENDING") return false;
    const leaveMonth = new Date(leave.startDate).toISOString().slice(0, 7);
    return leaveMonth === month;
  }).length;
}
function checkAndResetAnnualLeave(leaveRecord) {
  const currentYear = new Date().getFullYear();
  if (leaveRecord.lastResetYear < currentYear) {
    leaveRecord.annualLeaveBalance = 18;
    leaveRecord.lastResetYear = currentYear;
  }
}
async function recalcHistory(leaveRecord) {
  const employee = await EmployeeModel.findById(leaveRecord.employeeId);
  const salary = employee?.salary?.[0]?.salaryIncome || 0;

  const monthSummary = {};
  for (const leave of leaveRecord.leaves) {
    if (leave.status !== "APPROVED") continue;

    const parts = splitLeaveByMonth(leave.startDate, leave.endDate);
    for (const p of parts) {
      if (!monthSummary[p.month]) monthSummary[p.month] = 0;
      monthSummary[p.month] += p.days;
    }
  }

  leaveRecord.history = [];

  for (const month of Object.keys(monthSummary)) {
    const totalDays = monthSummary[month];

    let salaryDeducted = 0;

    if (totalDays > 2) {
      const extra = totalDays - 2;
      salaryDeducted = Math.ceil((salary / 30) * extra);
    }

    leaveRecord.history.push({
      month,
      totalDaysOff: totalDays,
      salaryDeducted
    });
  }
}

async function revertApprovedLeaveEffects(leave) {
  // Delete attachment from Cloudinary if exists (handle both old string and new object format)
  if (leave.attachment) {
    // New format: object with publicId
    if (typeof leave.attachment === 'object' && leave.attachment.publicId) {
      try {
        await deleteFromCloudinary(leave.attachment.publicId, leave.attachment.resourceType);
        console.log(`✅ Deleted leave attachment from Cloudinary: ${leave.attachment.publicId}`);
      } catch (error) {
        console.error(`❌ Failed to delete leave attachment: ${error.message}`);
      }
    }
    // Old format: string path - just log, no Cloudinary deletion needed
    else if (typeof leave.attachment === 'string') {
      console.log(`ℹ️ Old format attachment found (local file): ${leave.attachment}`);
    }
  }
  return;
}
const LeaveService = {
  createLeave: async (payload) => {
    const { employeeId, startDate, endDate, reason, status, isAdminCreating, attachment, userEmail } = payload;

    if (!startDate || !endDate)
      throw new AppError("Missing required fields: startDate and endDate", 422);
    if (isAdminCreating === true) {
      throw new AppError("Admin cannot create leave requests. Only users can request leaves.", 403);
    }
    let finalEmployeeId = employeeId;
    
    if (!finalEmployeeId && userEmail) {
      const employee = await EmployeeModel.findOne({ email: userEmail });
      if (!employee) {
        throw new AppError(
          `Employee record not found for email: ${userEmail}. Please contact admin to create your employee profile first.`,
          404
        );
      }
      finalEmployeeId = employee._id;
    }

    if (!finalEmployeeId) {
      throw new AppError("Employee ID is required or user must have an employee record", 422);
    }
    const employee = await EmployeeModel.findById(finalEmployeeId);
    if (!employee) throw new AppError("Employee not found", 404);

    const creator = payload.createdBy || null;

    const totalDays = calcDays(startDate, endDate);
    let leaveRecord = await LeaveModel.findOne({ employeeId: finalEmployeeId });

    if (!leaveRecord) {
      leaveRecord = await LeaveModel.create({
        employeeId: finalEmployeeId,
        leaves: [],
        history: [],
        annualLeaveBalance: 18,
        lastResetYear: new Date().getFullYear()
      });
    }
   checkAndResetAnnualLeave(leaveRecord);

 
    const leaveMonth = new Date(startDate).toISOString().slice(0, 7);
    const leavesInMonth = countLeavesInMonth(leaveRecord.leaves, leaveMonth);
    
    if (leavesInMonth >= 2) {
      throw new AppError("Maximum 2 leaves allowed per month", 400);
    }

    // VALIDATION 3: Check annual leave balance (18 per year)
    if (leaveRecord.annualLeaveBalance < totalDays) {
      throw new AppError(
        `Insufficient annual leave balance. Available: ${leaveRecord.annualLeaveBalance} days, Requested: ${totalDays} days`,
        400
      );
    }

    const leavePayload = {
      startDate: normalizeDate(startDate),
      endDate: normalizeDate(endDate),
      reason: reason || "",
      status: "PENDING", // Always PENDING when created by user
      totalDays: totalDays,
      createdBy: creator,
      approvedBy: null,
      attachment: attachment || null
    };

    leaveRecord.leaves.unshift(leavePayload);

    await recalcHistory(leaveRecord);
    await leaveRecord.save();

    const result = await LeaveModel.findById(leaveRecord._id)
      .populate("employeeId")
      .populate("leaves.createdBy", "name")
      .populate("leaves.approvedBy", "name");

    // Calculate pending days (not yet in history since not approved)
    const pendingDays = result.leaves
      .filter(l => l.status === "PENDING")
      .reduce((sum, l) => sum + l.totalDays, 0);

    console.log(`📊 Leave created - Pending: ${pendingDays} days, History will update when approved`);

    return result;
  },

  // ======================================
  // UPDATE LEAVE (ALSO POPULATES)
  // ======================================
  updateLeave: async (leaveId, payload) => {
    const leaveRecord = await LeaveModel.findOne({
      "leaves._id": leaveId
    });

    if (!leaveRecord) throw new AppError("Leave not found", 404);

    const leave = leaveRecord.leaves.id(leaveId);
    if (!leave) throw new AppError("Leave entry not found", 404);

    const previousStatus = leave.status;

    // Admin can only change status, not dates/reason
    if (payload.status) {
      leave.status = payload.status;

      leave.approvedBy =
        payload.status === "APPROVED"
          ? payload.approvedBy || payload.updatedBy || leave.approvedBy
          : null;

      // Handle annual leave balance based on status change
      checkAndResetAnnualLeave(leaveRecord);

      if (payload.status === "APPROVED" && previousStatus !== "APPROVED") {
        // Deduct from annual leave balance
        leaveRecord.annualLeaveBalance -= leave.totalDays;
      } else if (previousStatus === "APPROVED" && payload.status === "REJECTED") {
        // Restore to annual leave balance
        leaveRecord.annualLeaveBalance += leave.totalDays;
      }
    }

    // If only approvedBy is updated
    if (payload.approvedBy && !payload.status) {
      if (leave.status === "APPROVED") leave.approvedBy = payload.approvedBy;
    }

    await recalcHistory(leaveRecord);
    await leaveRecord.save();

    return await LeaveModel.findById(leaveRecord._id)
      .populate("employeeId")
      .populate("leaves.createdBy", "name")
      .populate("leaves.approvedBy", "name");
  },

  // ======================================
  // GET ALL LEAVES (POPULATED)
  // ======================================
  getAllLeaves: async () => {
    try {
      return await LeaveModel.find({})
        .populate("employeeId", "name email phone cnic employeeCode employeeType designation department")
        .populate("leaves.createdBy", "name")
        .populate("leaves.approvedBy", "name")
        .sort({ createdAt: -1 });
    } catch (err) {
      throw new AppError("Failed to fetch leaves", 500);
    }
  },

  // ======================================
  // GET USER'S OWN LEAVE INFO (with balance and history)
  // ======================================
  getMyLeaveInfo: async (employeeId, userEmail) => {
    try {
      console.log('🔎 Service: Finding employee with:', { employeeId, userEmail });
      
      let finalEmployeeId = employeeId;

      // If no employeeId provided, find by user's email
      if (!finalEmployeeId && userEmail) {
        const employee = await EmployeeModel.findOne({ email: userEmail });
        console.log('👨‍💼 Found employee by email:', employee ? 'Yes' : 'No');
        
        if (!employee) {
          throw new AppError(
            `Employee record not found for email: ${userEmail}. Please contact admin to create your employee profile first.`,
            404
          );
        }
        finalEmployeeId = employee._id;
      }

      if (!finalEmployeeId) {
        throw new AppError("Employee ID or email is required", 400);
      }

      console.log('🆔 Final employeeId:', finalEmployeeId);

      let leaveRecord = await LeaveModel.findOne({ employeeId: finalEmployeeId })
        .populate("employeeId", "name email phone cnic employeeCode")
        .populate("leaves.createdBy", "name")
        .populate("leaves.approvedBy", "name");

      console.log('📋 Found leave record:', leaveRecord ? 'Yes' : 'No');

      if (!leaveRecord) {
        // Create default record if doesn't exist
        console.log('📝 Creating new leave record...');
        leaveRecord = await LeaveModel.create({
          employeeId: finalEmployeeId,
          leaves: [],
          history: [],
          annualLeaveBalance: 18,
          lastResetYear: new Date().getFullYear()
        });
        
        leaveRecord = await LeaveModel.findById(leaveRecord._id)
          .populate("employeeId", "name email phone cnic employeeCode")
          .populate("leaves.createdBy", "name")
          .populate("leaves.approvedBy", "name");
      }

      // Check and reset if new year
      checkAndResetAnnualLeave(leaveRecord);
      await leaveRecord.save();

      // Separate leaves by status for easy viewing
      const pendingLeaves = leaveRecord.leaves.filter(l => l.status === "PENDING");
      const approvedLeaves = leaveRecord.leaves.filter(l => l.status === "APPROVED");
      const rejectedLeaves = leaveRecord.leaves.filter(l => l.status === "REJECTED");

      // Calculate pending days (not in history yet)
      const pendingDays = pendingLeaves.reduce((sum, l) => sum + l.totalDays, 0);
      const approvedDays = approvedLeaves.reduce((sum, l) => sum + l.totalDays, 0);

      console.log('✅ Successfully retrieved leave info');

      return {
        employee: leaveRecord.employeeId,
        annualLeaveBalance: leaveRecord.annualLeaveBalance,
        totalAnnualLeave: 18,
        lastResetYear: leaveRecord.lastResetYear,
        
        // Leave counts for quick overview
        leaveCounts: {
          pending: pendingLeaves.length,
          approved: approvedLeaves.length,
          rejected: rejectedLeaves.length,
          pendingDays: pendingDays,
          approvedDays: approvedDays
        },
        
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        history: leaveRecord.history
      };
    } catch (err) {
      console.error('❌ Service Error in getMyLeaveInfo:', err);
      // Re-throw the original error instead of wrapping it
      if (err instanceof AppError) throw err;
      throw new AppError(err.message || "Failed to fetch leave information", 500);
    }
  },

  getLeaveById: async (id) => {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError("Invalid ID format", 400);
    }

    // Try full document
    const doc = await LeaveModel.findById(id)
      .populate("employeeId", "name email")
      .populate("leaves.createdBy", "name")
      .populate("leaves.approvedBy", "name");

    if (doc) return { type: "document", data: doc };

    // Try leaf
    const leaveRecord = await LeaveModel.findOne({ "leaves._id": id })
      .populate("employeeId", "name email")
      .populate("leaves.createdBy", "name")
      .populate("leaves.approvedBy", "name");

    if (!leaveRecord) throw new AppError("Leave not found", 404);

    return {
      type: "leave",
      parentId: leaveRecord._id,
      data: leaveRecord.leaves.id(id)
    };
  },
  deleteLeave: async (ids) => {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError("Please provide an array of IDs", 400);
      }

      const invalid = ids.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
      if (invalid.length) throw new AppError("Invalid IDs provided", 400);

      let deletedDocs = 0;
      let deletedLeaves = 0;

      // Delete full docs
      const docs = await LeaveModel.find({ _id: { $in: ids } });
      for (const doc of docs) {
         for (const leave of doc.leaves) {
          if (leave.attachment) {
            if (typeof leave.attachment === 'object' && leave.attachment.publicId) {
              try {
                await deleteFromCloudinary(leave.attachment.publicId, leave.attachment.resourceType);
                console.log(`✅ Deleted attachment from Cloudinary: ${leave.attachment.publicId}`);
              } catch (error) {
                console.error(`❌ Failed to delete attachment: ${error.message}`);
              }
            }
            else if (typeof leave.attachment === 'string') {
              console.log(`ℹ️ Old format attachment (skipping): ${leave.attachment}`);
            }
          }
        }
        await LeaveModel.findByIdAndDelete(doc._id);
        deletedDocs++;
      }

      const remaining = ids.filter(id => !docs.some(d => String(d._id) === id));
      if (remaining.length) {
        const records = await LeaveModel.find({
          "leaves._id": { $in: remaining }
        });

        for (const record of records) {
          for (const id of remaining) {
            const leave = record.leaves.id(id);
            if (leave) {
              if (leave.status === "APPROVED") {
                await revertApprovedLeaveEffects(leave.toObject());
              }
              leave.deleteOne();
              deletedLeaves++;
            }
          }

          await recalcHistory(record);
          await record.save();

          if (record.leaves.length === 0) {
            await LeaveModel.findByIdAndDelete(record._id);
            deletedDocs++;
          }
        }
      }

      return {
        deletedDocs,
        deletedLeaves
      };

    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to delete leave(s)", 500);
    }
  }
};

export default LeaveService;
