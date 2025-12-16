import authUser from "../modules/user/routes.js";
import roleRoutes from "../modules/role/routes.js";
import inviteRoutes from "../modules/invites/routes.js";
import orgRoutes from "../modules/organization/routes.js";
import empRoutes from "../modules/employee/routes.js";
import proRoutes from "../modules/project/routes.js";
import fileRoutes from "../modules/fileRecord/routes.js";
import bankRoutes from "../modules/bank/routes.js";
import assetRoutes from "../modules/expenses/asset/route.js";
import bussinessRoutes from "../modules/expenses/business/route.js";
import billRoutes from "../modules/expenses/bill/route.js";
import DonationRoutes from "../modules/expenses/donation/route.js";
import GeneralExpenseRoutes from "../modules/expenses/general/route.js";
import salaryRoutes from "../modules/expenses/salary/route.js";
import leaveRoutes from "../modules/leave/route.js";
import commissionRoute from "../modules/commission/route.js"
import admindashboard from "../modules/dashboard/route.js"
import financialMonthRoutes from "../modules/financialMonth/routes.js";
import express from "express";

const app = express();
app.use(express.json());

export default (app) => {
  const apiRoute = express.Router();
  apiRoute.use("/users", authUser);
  apiRoute.use("/roles", roleRoutes);
  apiRoute.use("/", inviteRoutes);
  apiRoute.use("/organizations", orgRoutes);
  apiRoute.use("/employees", empRoutes);
  apiRoute.use("/projects", proRoutes);
  apiRoute.use("/files", fileRoutes);
  apiRoute.use("/banks", bankRoutes);
  apiRoute.use("/assets", assetRoutes);
  apiRoute.use("/business", bussinessRoutes);
  apiRoute.use("/billing-expenses", billRoutes);
  apiRoute.use("/donation-expenses", DonationRoutes);
  apiRoute.use("/general-expenses", GeneralExpenseRoutes);
  apiRoute.use("/salary-expenses", salaryRoutes);
  apiRoute.use("/leave", leaveRoutes);
  apiRoute.use("/commission",commissionRoute );
  apiRoute.use("/dashboard",admindashboard )
  apiRoute.use("/financial-month" , financialMonthRoutes );

  app.use("/api/v1", apiRoute);
};
