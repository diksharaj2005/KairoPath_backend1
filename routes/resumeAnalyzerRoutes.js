import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { analyzeResume } from "../controllers/analyzeController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// -----------------------------
// MULTER ERROR HANDLER
// -----------------------------
const handleUploadErrors = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      message: err.message || "File upload error"
    });
  }
  next();
};

// -----------------------------
// RESUME ANALYZER ROUTE
// -----------------------------
router.post(
  "/analyze",
  authMiddleware,
  upload.single("resume"),
  handleUploadErrors,
  analyzeResume
);

export default router;
