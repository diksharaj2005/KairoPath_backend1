import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import resumeAnalyzerRoutes from "./routes/resumeAnalyzerRoutes.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import mockInterviewRoutes from "./routes/mockInterviewRoutes.js";

/* ===== DEBUG ENV ===== */

console.log(
  "JWT_ACCESS_SECRET:",
  process.env.JWT_ACCESS_SECRET ? "LOADED" : "MISSING"
);

console.log(
  "JWT_REFRESH_SECRET:",
  process.env.JWT_REFRESH_SECRET ? "LOADED" : "MISSING"
);

console.log(
  "Gemini Key Loaded:",
  process.env.GEMINI_API_KEY ? "YES" : "NO"
);

/* ===== EXPRESS APP ===== */

const app = express();

/* ===== MIDDLEWARE ===== */

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== STATIC ===== */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===== DB ===== */

connectDB();

/* ===== HEALTH ===== */

app.get("/", (req, res) => {
  res.send("KairoPath API is running");
});

/* ===== ROUTES ===== */

app.use("/api/auth", authRoutes);
app.use("/api/analyzer", resumeAnalyzerRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api", mockInterviewRoutes);

/* ===== EXPORT FOR VERCEL ===== */

export default app;

/* ===== LOCAL DEV ONLY ===== */

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}