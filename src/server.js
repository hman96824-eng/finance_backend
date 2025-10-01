import { config } from "./config/config.js";

import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import cors from "cors";
import express from "express";
import ApiError from "./utils/ApiError.js";
import finalresponse from "./middleware/response.js";

import dotenv from "dotenv";
dotenv.config();
const port = config.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors());

// load your routes
routes(app);

// Error handling middleware (should be last)
app.use(finalresponse);
console.log("mongoose error ");
const startServer = async () => {
  try {
    connectDB();
    app.listen(port, () => {
      console.log(`✅ Server running on ${port}`);
    });
  } catch (err) {
    throw new ApiError(404, err.message);
  }
};

startServer();
