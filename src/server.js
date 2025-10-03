import { config } from "./config/config.js";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import cors from "cors";
import express from "express";
import ApiError from "./utils/ApiError.js";
import finalresponse from "./middleware/response.js";
import { createServer } from "http";  // ⬅️ import http
import { Server } from "socket.io";   // ⬅️ import socket.io

const port = 5000;

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: config.CORS_ORIGIN || "http://localhost:3000", // frontend url
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// load routes
routes(app);
// error handler (last)
app.use(finalresponse);

// ✅ Create http server from express
const httpServer = createServer(app);

// ✅ Initialize socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ✅ Listen for socket connections
io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

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
    throw new ApiError(404, err.message);
  }
};

startServer();
