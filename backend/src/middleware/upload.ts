import multer from "multer";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

const RESUME_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

/**
 * Files are buffered in memory and handed to the storage service, so no driver is
 * tied to the local filesystem. MAX_UPLOAD_MB caps the size before anything is read.
 */
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!RESUME_MIME_TYPES.has(file.mimetype)) {
      callback(ApiError.badRequest("Resume must be a PDF, Word document or plain text file"));
      return;
    }
    callback(null, true);
  },
}).single("file");
