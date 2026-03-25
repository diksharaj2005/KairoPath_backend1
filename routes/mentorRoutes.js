import express from "express";
import {
  startSession,
  mentorChat,
  getSession
} from "../controllers/mentorController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// -----------------------------
// MENTOR ROUTES
// -----------------------------

// Create new mentor session
router.post("/session", authMiddleware, startSession);

// Chat with mentor
router.post("/session/:sessionId/chat", authMiddleware, mentorChat);

// Get mentor session history
router.get("/session/:sessionId", authMiddleware, getSession);

export default router;
