import { LeaveModel } from "./model.js";
import { EmployeeModel } from "../employee/model.js";

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// ----------------------------
// Helpers
// ----------------------------
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

// ----------------------------
// Recalculate salary effects
// ----------------------------
async function recalcHistory(leaveRecord) {
  const employee = await EmployeeModel.findById(leaveRecord.employeeId);
  const salary = employee?.salary?.[0]?.salaryIncome || 0;

  const monthSummary = {};

  // Collect APPROVED leave days per month
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
  // reserved for future logic
  return;
}

// ----------------------------
// Leave Service
// ----------------------------
const LeaveService = {

  // ======================================
  // CREATE LEAVE
  // ======================================
  createLeave: async (payload) => {
    const { employeeId, startDate, endDate, reason, status } = payload;

    if (!employeeId || !startDate || !endDate)
      throw new AppError("Missing required fields", 422);

    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) throw new AppError("Employee not found", 404);

    const creator = payload.createdBy || null;
    const isApproved = status === "APPROVED";

    const leavePayload = {
      startDate: normalizeDate(startDate),
      endDate: normalizeDate(endDate),
      reason: reason || "",
      status: status || "PENDING",
      totalDays: calcDays(startDate, endDate),
      createdBy: creator,
      approvedBy: isApproved ? (payload.approvedBy || creator) : null
    };

    let leaveRecord = await LeaveModel.findOne({ employeeId });

    if (!leaveRecord) {
      leaveRecord = await LeaveModel.create({
        employeeId,
        leaves: [],
        history: []
      });
    }

   leaveRecord.leaves.unshift(leavePayload);

    await recalcHistory(leaveRecord);
    await leaveRecord.save();

    return await LeaveModel.findById(leaveRecord._id)
      .populate("employeeId")
      .populate("leaves.createdBy", "name")
      .populate("leaves.approvedBy", "name");
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

    if (payload.startDate) leave.startDate = normalizeDate(payload.startDate);
    if (payload.endDate) leave.endDate = normalizeDate(payload.endDate);
    if (typeof payload.reason === "string") leave.reason = payload.reason;

    // Status update
    if (payload.status) {
      leave.status = payload.status;

      leave.approvedBy =
        payload.status === "APPROVED"
          ? payload.approvedBy || payload.updatedBy || leave.approvedBy
          : null;
    }

    // If only approvedBy is updated
    if (payload.approvedBy && !payload.status) {
      if (leave.status === "APPROVED") leave.approvedBy = payload.approvedBy;
    }

    leave.totalDays = calcDays(leave.startDate, leave.endDate);

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
  // GET LEAVE BY ID (DOCUMENT OR LEAF)
  // ======================================
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

  // ======================================
  // DELETE LEAVE (ALSO RETURNS POPULATED)
  // ======================================
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
        await LeaveModel.findByIdAndDelete(doc._id);
        deletedDocs++;
      }

      const remaining = ids.filter(id => !docs.some(d => String(d._id) === id));

      // Delete individual leaves
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
