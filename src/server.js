import dotenv from "dotenv";
dotenv.config();
import { config } from "./config/config.js";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import cors from "cors";
import express from "express";
import ApiError from "./modules/utils/ApiError.js";
import errorMiddleware from "./middleware/error.middleware.js";

const port = config.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors());

// load your routes
routes(app);

// Error handling middleware (should be last)
app.use(errorMiddleware);

const startServer = async () => {
  try {
    connectDB();
    app.listen(port, () => {
      console.log(`🚀 Server running on ${port}`);
    });
  } catch (err) {
    throw new ApiError(404, err.message);
  }
};

startServer();
