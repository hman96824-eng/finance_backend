import authUser from "../modules/user/routes.js";
import roleRoutes from "../modules/role/routes.js";
import inviteRoutes from "../modules/invites/routes.js";
import orgRoutes from "../modules/organization/routes.js";
import empRoutes from "../modules/employee/routes.js";
import proRoutes from "../modules/project/routes.js";
import fileRoutes from "../modules/fileRecord/routes.js";
import bankRoutes from "../modules/bank/routes.js";
import assetRoutes from "../modules/expenses/asset/route.js";
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

  app.use("/api/v1", apiRoute);
};
