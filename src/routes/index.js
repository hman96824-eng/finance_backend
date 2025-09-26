import authUser from "../modules/user/routes.js";
import express from "express";

export default (app) => {
  const apiRoute = express.Router();
  apiRoute.use("/", authUser);
  app.use("/api/v1/users", apiRoute);
};
