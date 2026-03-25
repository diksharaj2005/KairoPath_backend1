import express from "express";
import {
  startInterview,
  startInterviewWithResume,
  saveAnswer,
  completeInterview,
  getInterview,
  getUserInterviews,
} from "../controllers/mockInterviewController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// -----------------------------
// MOCK INTERVIEW ROUTES
// -----------------------------

// Create new mock interview session (job-based)
router.post("/interview", authMiddleware, startInterview);

// Create new mock interview session with resume upload
router.post("/interview/resume", authMiddleware, upload.single('resume'), startInterviewWithResume);

// Save answer and get immediate feedback
router.post("/interview/:interviewId/answer", authMiddleware, saveAnswer);

// Complete interview and get final feedback
router.post("/interview/:interviewId/complete", authMiddleware, completeInterview);

// Get specific interview
router.get("/interview/:interviewId", authMiddleware, getInterview);

// Get all interviews for current user
router.get("/interviews", authMiddleware, getUserInterviews);

export default router;

