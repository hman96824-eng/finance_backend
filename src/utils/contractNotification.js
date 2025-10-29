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
            console.log(`👤 HR user (${hrUserId}) joined the HR notifications room`);
        });

        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected:", socket.id);
        });
    });

    /**
     * Periodically check employee contracts that are about to expire
     * and notify HR room if found.
     */
    const checkContractExpiries = async () => {
        try {
            const today = moment();
            const threshold = moment().add(7, "days"); // 7 days before expiry

            // Find employees whose contract end date is within 7 days
            const expiringContracts = await EmployeeModel.find({
                "contractDetails.contractEndDate": {
                    $lte: threshold.toDate(),
                    $gte: today.toDate(),
                },
            });

            if (expiringContracts.length > 0) {
                // First populate all employees with their avatars
                const populatedEmployees = await EmployeeModel.populate(expiringContracts, {
                    path: 'avatar',
                    select: 'url'
                });

                const formattedEmployees = populatedEmployees.map((emp) => ({
                    _id: emp._id,
                    name: emp.name,
                    email: emp.email,
                    employeeCode: emp.employeeCode,
                    department: emp.department?.departmentName || "N/A",
                    designation: emp.department?.designation || "N/A",
                    contractType: emp.contractDetails.contractType,
                    contractEndDate: emp.contractDetails.contractEndDate,
                    avatar: emp.avatar?.url || null
                }));
                // Emit to HR room
                io.to("hr_notifications").emit("contract_expiry_alert", formattedEmployees);
                console.log(`🚨 Sent ${formattedEmployees.length} contract expiry alerts to HR`);
            }
        } catch (err) {
            console.error("❌ Error checking contracts:", err);
        }
    };

    // Run every 12 hours
    // setInterval(checkContractExpiries, 1000 * 60 * 60 * 12);

    // run every mint for testing purpose
    setInterval(checkContractExpiries, 1000 * 60);
};
