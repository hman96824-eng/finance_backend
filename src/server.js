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

// console.log("CORS ORIGIN:", config.corsSettings.origin);

app.use(cors(config.corsSettings));

// app.use(express.json());
app.use(express.json({ limit: "10mb" })); // default is 100kb
app.use(express.urlencoded({ limit: "10mb", extended: true }));

routes(app);

app.use(finalresponse);

// ✅ Create http server from express
const httpServer = createServer(app);

// ✅ Initialize socket.io
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = config.CORS_ORIGIN
        ? config.CORS_ORIGIN.split(',').map(o => o.trim())
        : ["http://localhost:3000"];
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
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
      console.log(`✅ Server running http://localhost:${port} `);
      // console.log(config.corsSettings.origin, "setting here");
    });
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }
};

startServer();
