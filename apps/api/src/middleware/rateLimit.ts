import expressRateLimit from "express-rate-limit";

export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  return expressRateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message ?? "Too many requests. Please slow down.",
  });
}
