import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// -----------------------------
// PUBLIC AUTH ROUTES
// -----------------------------
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

// -----------------------------
// PROTECTED AUTH ROUTES
// -----------------------------
// All routes below require authentication

// Get current user profile
router.get("/me", authMiddleware, getCurrentUser);

// Update user profile
router.put("/profile", authMiddleware, updateProfile);

// Change password
router.put("/password", authMiddleware, changePassword);

export default router;
