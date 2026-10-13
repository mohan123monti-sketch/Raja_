import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config(); // fallback

import authRouter from "./routes/auth";
import playersRouter from "./routes/players";
import teamsRouter from "./routes/teams";
import gamesRouter from "./routes/games";
import { setupSocketGateway } from "./socket/gateway";

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const isDev = process.env.NODE_ENV !== "production";
const corsOrigin = isDev
  ? true
  : [CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"];

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// REST API Routes
app.use("/api/auth", authRouter);
app.use("/api/players", playersRouter);
app.use("/api/teams", teamsRouter);
app.use("/api", gamesRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Setup Socket.IO Gateway
const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

setupSocketGateway(io);

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`[Raja Rani Server] Running on http://localhost:${PORT}`);
  });
}

export { app, server, io };
