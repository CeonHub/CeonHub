import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOrigins, isProduction } from "./config/env";
import { apiRateLimit } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { apiRouter } from "./routes";
import { LocalStorageService, storage } from "./services/storage";
import { ApiError } from "./utils/apiError";
import { sendSuccess } from "./utils/response";

/**
 * Builds the Express application. Kept separate from server.ts so tests can mount
 * the app with Supertest without opening a port.
 */
export function createApp(): Express {
  const app = express();

  // Render/Railway/Fly terminate TLS in front of the app; without this the rate
  // limiter sees a single proxy IP and secure cookies are dropped.
  if (isProduction) {
    app.set("trust proxy", 1);
  }
  app.disable("x-powered-by");

  app.use(
    helmet({
      // The frontend runs on a different origin and needs to load files served from
      // /uploads (resumes, logos). Cross-origin *API* access is still governed by CORS.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header: same-origin, curl, or a server-side request.
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(ApiError.forbidden(`Origin ${origin} is not allowed`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok", uptime: Math.round(process.uptime()) });
  });

  // The local storage driver keeps files on disk next to the API and serves them
  // here. Other drivers (S3 and friends) return their own URLs and skip this.
  if (storage instanceof LocalStorageService) {
    app.use(
      "/uploads",
      express.static(storage.directory, { index: false, dotfiles: "ignore", maxAge: "1h" }),
    );
  }

  app.use("/api", apiRateLimit, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
