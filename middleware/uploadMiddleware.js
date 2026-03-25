import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debugging: Log file details
const debugFileFilter = (req, file, cb) => {
  console.log("Debug: File received in middleware", file);
  fileFilter(req, file, cb);
};

// -----------------------------
// FILE VALIDATION (PDF ONLY)
// -----------------------------
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// -----------------------------
// DISK STORAGE
// -----------------------------
const storage = multer.memoryStorage();

// -----------------------------
// MULTER INSTANCE
// -----------------------------
export const upload = multer({
  storage,
  fileFilter: debugFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

