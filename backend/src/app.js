import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import lecturerRoutes from "./routes/lecturerRoutes.js";
import prlRoutes from "./routes/prlRoutes.js";
import plRoutes from "./routes/plRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminEnhancedRoutes from "./routes/adminEnhancedRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL?.split(",") ?? ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/lecturer", lecturerRoutes);
app.use("/api/prl", prlRoutes);
app.use("/api/pl", plRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminEnhancedRoutes);
app.use("/api", exportRoutes);

app.use(errorHandler);

export default app;
