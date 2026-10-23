import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserModel, type UserDoc } from "../models/index";
import { requireAuth, signToken } from "../middleware/auth";
import { HttpError, validateBody } from "../middleware/errors";
import { LANGUAGES, type LanguageCode } from "@nexclass/shared";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

const languageCodes = LANGUAGES.map((l) => l.code) as [LanguageCode, ...LanguageCode[]];

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  role: z.enum(["teacher", "student"]).default("student"),
  preferredLanguage: z.enum(languageCodes).default("en"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: "Too many authentication attempts. Please try again in a few minutes.",
});

function toPublicUser(user: UserDoc) {
  return {
    id: user.id!,
    name: user.name,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
  };
}

router.post("/register", authLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, role, preferredLanguage } = req.body as z.infer<
      typeof registerSchema
    >;
    const existing = await UserModel.findOne({ email });
    if (existing) {
      throw new HttpError(409, "An account with this email already exists.", "email_taken");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name,
      email,
      passwordHash,
      role,
      preferredLanguage,
    });
    const token = signToken({
      sub: user.id!,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new HttpError(401, "Incorrect email or password.", "invalid_credentials");
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, "Incorrect email or password.", "invalid_credentials");
    }
    const token = signToken({
      sub: user.id!,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    res.json({ token, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.auth!.sub);
    if (!user) throw new HttpError(404, "Account not found.", "not_found");
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  // Tokens are stateless; the client discards the token. The endpoint exists so
  // the client has a single, explicit logout contract.
  res.json({ ok: true });
});

export default router;
