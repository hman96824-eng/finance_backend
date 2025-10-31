import { config } from "./config/config.js";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import cors from "cors";
import express from "express";
import ApiError from "./utils/ApiError.js";
import finalresponse from "./middleware/response.js";
import { createServer } from "http"; // ⬅️ import http
import { Server } from "socket.io"; // ⬅️ import socket.io
import { initContractNotificationSocket } from "./utils/contractNotification.js";

const port = config.PORT || 5000;

const app = express();
// app.use(express.json());
app.use(express.json({ limit: "10mb" })); // default is 100kb
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const corssetting = { ...config.corsSettings };
app.use(cors(corssetting));

routes(app);
app.use(finalresponse);

// ✅ Create http server from express
const httpServer = createServer(app);

// ✅ Initialize socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Initialize contract notification logic
initContractNotificationSocket(io);

// Export io so controllers/services can emit events
export { io, httpServer };

// Start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(port, () => {
      console.log(`✅ Server running on http://localhost:${port}`);
    });
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }
};

startServer();
