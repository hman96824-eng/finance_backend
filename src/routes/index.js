import authUser from "../modules/user/routes.js";
import roleRoutes from "../modules/role/routes.js"
import inviteRoutes from "../modules/invites/routes.js"
import express from "express";

const app = express()
app.use(express.json())

export default (app) => {
    const apiRoute = express.Router();
    apiRoute.use("/users", authUser);
    apiRoute.use("/roles", roleRoutes);
    apiRoute.use("/", inviteRoutes)
    app.use("/api/v1", apiRoute);
};