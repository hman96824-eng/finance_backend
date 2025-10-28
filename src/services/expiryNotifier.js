import { Employee } from "../modules/employee/model.js";
import { getIO } from "../server.js"; // ✅ use exported io
const io = getIO();
// Helper: Check if date is within 15 days
const isWithin15Days = (date) => {
  const today = new Date();
  const target = new Date(date);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diffDays <= 15 && diffDays >= 0;
};

export const checkExpiringContracts = async () => {
  try {
    const employees = await Employee.find({});

    // Filter contracts/salaries ending in next 15 days
    const expiringEmployees = employees.filter((emp) => {
      const contractEnd = emp.contractDetails?.contractEndDate;
      const salaryEnd = emp.salary?.[emp.salary.length - 1]?.salaryEndDate;
      return (
        (contractEnd && isWithin15Days(contractEnd)) ||
        (salaryEnd && isWithin15Days(salaryEnd))
      );
    });

    if (expiringEmployees.length > 0) {
      console.log(`🚨 Found ${expiringEmployees.length} expiring employees`);
      io.to("hr_room").emit("contract_expiry_alert", expiringEmployees);
    } else {
      console.log("✅ No expiring employees found");
    }
  } catch (error) {
    console.error("Error checking expiring contracts:", error.message);
  }
};
