import { EmployeeModel } from "../modules/employee/model.js";
import moment from "moment";

/**
 * Initialize Socket.IO room and start periodic contract expiry checks.
 * @param {Server} io - Socket.IO server instance
 */
export const initContractNotificationSocket = (io) => {
    // When a new client connects
    io.on("connection", (socket) => {
        console.log("⚡ Socket connected:", socket.id);

        // HR joins the special notification room
        socket.on("join_hr_room", (hrUserId) => {
            socket.join("hr_notifications");
            // console.log(`👤 HR (${hrUserId}) joined `);
        });

        socket.on("disconnect", () => {
            // console.log("❌ Socket disconnected:", socket.id);
        });
    });

    /**
     * Periodically check employee contracts that are about to expire
     * and notify HR room if found.
     */
    const checkContractExpiries = async () => {
        try {
            const today = moment();
            const threshold = moment().add(7, "days"); // up to next 7 days

            // ✅ Include:
            // - Active employees expiring within 7 days
            // - Expired employees (end date before today)
            const expiringContracts = await EmployeeModel.find({
                $or: [
                    {
                        // status: { $in: "Active" },
                        "contractDetails.contractEndDate": {
                            $lte: threshold.toDate(),
                            $gte: today.toDate(),
                        },
                    },
                    {
                        status: { $regex: /^expired$/i },
                        "contractDetails.contractEndDate": { $lt: today.toDate() }, // already expired
                    },
                ],
            });
            if (expiringContracts.length > 0) {
                // Populate avatars
                const populatedEmployees = await EmployeeModel.populate(
                    expiringContracts,
                    {
                        path: "avatar",
                        select: "url",
                    }
                );

                // Format employee data and calculate expiry days
                const formattedEmployees = populatedEmployees.map((emp) => {
                    const endDate = moment(emp.contractDetails.contractEndDate).endOf(
                        "day"
                    );
                    const diffDays = endDate.diff(today, "days");
                    const isExpired = diffDays < 0;

                    return {
                        _id: emp._id,
                        name: emp.name,
                        email: emp.email,
                        employeeCode: emp.employeeCode,
                        department: emp.department?.departmentName || "N/A",
                        designation: emp.department?.designation || "N/A",
                        contractType: emp.contractDetails.contractType,
                        contractEndDate: emp.contractDetails.contractEndDate,
                        avatar: emp.avatar?.url || null,
                        daysRemaining: isExpired ? 0 : diffDays, // show remaining days for active
                        status: emp.status,
                    };
                });

                // Emit to HR room
                io.to("hr_notifications").emit(
                    "contract_expiry_alert",
                    formattedEmployees
                );

                console.log(
                    `🚨 Sent ${formattedEmployees.length} contract expiry alerts to HR`
                );
            }
        } catch (err) {
            console.error("❌ Error checking contracts:", err);
        }
    };

    // Check every minute
    setInterval(checkContractExpiries, 1000 * 60);
};
