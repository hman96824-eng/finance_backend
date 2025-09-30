import authUser from "../modules/user/routes.js";
import express from "express";
const app = express()
app.use(express.json())
export default (app) => {
    const apiRoute = express.Router();
    apiRoute.use("/users", authUser);
    app.use("/api/v1", apiRoute);
};
