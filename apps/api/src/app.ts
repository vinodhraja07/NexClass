import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { env } from "./config/env";
import { rateLimit } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errors";
import authRoutes from "./routes/auth";
import meetingRoutes from "./routes/meetings";
import recordingRoutes from "./routes/recordings";
import providerRoutes from "./routes/providers";
import demoRoutes from "./routes/demo";
import { LANGUAGES } from "@nexclass/shared";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.clientOrigin.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    "/api",
    rateLimit({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      message: "Too many requests. Please slow down and try again shortly.",
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "nexclass-api", time: new Date().toISOString() });
  });

  app.get("/api/languages", (_req, res) => {
    res.json({ languages: LANGUAGES });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", meetingRoutes);
  app.use("/api", recordingRoutes);
  app.use("/api/providers", providerRoutes);
  app.use("/api/demo", demoRoutes);

  // Serve the production web build when it is available (single-server deploy).
  const here = path.dirname(fileURLToPath(import.meta.url));
  const webDist = path.resolve(here, "../../web/dist");
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(webDist, "index.html"));
    });
  }

  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}
