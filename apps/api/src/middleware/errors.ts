import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "error",
    public details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new HttpError(400, "The request payload is invalid.", "validation_error", formatZod(result.error)));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new HttpError(400, "The request query is invalid.", "validation_error", formatZod(result.error)));
      return;
    }
    req.query = result.data as unknown as Request["query"];
    next();
  };
}

function formatZod(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Resource not found." });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ error: "The request payload is invalid.", code: "validation_error", details: formatZod(error) });
    return;
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error:", error);
  // A second response after headers are already sent throws synchronously and
  // (under tsx watch) restarts the whole API, dropping every live socket.
  if (!res.headersSent) {
    res.status(500).json({
      error: "Unexpected server error.",
      code: "internal_error",
      ...(process.env.NODE_ENV !== "production" ? { debug: message } : {}),
    });
  }
}
