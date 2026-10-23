import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { ParticipantRole } from "@nexclass/shared";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: ParticipantRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    if (!decoded.sub) return null;
    return {
      sub: String(decoded.sub),
      email: String(decoded.email ?? ""),
      name: String(decoded.name ?? ""),
      role: (decoded.role as ParticipantRole) ?? "student",
    };
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7).trim();
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("nexclass_token="));
    if (match) return decodeURIComponent(match.slice("nexclass_token=".length));
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Your session is invalid or has expired." });
    return;
  }
  req.auth = payload;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.auth = payload;
  }
  next();
}

export function requireRole(...roles: ParticipantRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
}
