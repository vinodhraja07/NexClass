import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: process.env.ENV_FILE ?? ".env" });
loadEnv({ path: ".env.local", override: false });

const boolish = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1" || v === "yes");

const optionalString = z.string().optional().transform((v) => (v ? v.trim() : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  MONGODB_URI: optionalString,
  MONGODB_DB_NAME: z.string().default("nexclass"),
  REDIS_URL: optionalString,

  JWT_SECRET: z.string().default("nexclass-development-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  STUN_SERVERS: z.string().default("stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302"),
  TURN_SERVER_URL: optionalString,
  TURN_USERNAME: optionalString,
  TURN_PASSWORD: optionalString,

  ASR_PROVIDER: z.string().default("browser"),
  ASR_API_KEY: optionalString,
  ASR_API_URL: optionalString,

  TRANSLATION_PROVIDER: z.string().default("none"),
  TRANSLATION_API_KEY: optionalString,
  TRANSLATION_API_URL: optionalString,
  TRANSLATION_MODEL: z.string().default("indic-trans2"),

  TTS_PROVIDER: z.string().default("browser"),
  TTS_API_KEY: optionalString,
  TTS_API_URL: optionalString,

  TERM_ASSIST_PROVIDER: z.string().default("none"),
  TERM_ASSIST_API_KEY: optionalString,

  ALLOW_GUEST_JOIN: z
    .string()
    .optional()
    .transform((v) => (v ? ["true", "1", "yes"].includes(v.toLowerCase()) : true)),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

const asList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
  port: raw.PORT,
  clientOrigin: raw.CLIENT_ORIGIN,
  mongoUri: raw.MONGODB_URI,
  mongoDbName: raw.MONGODB_DB_NAME,
  redisUrl: raw.REDIS_URL,
  jwtSecret: raw.JWT_SECRET,
  jwtExpiresIn: raw.JWT_EXPIRES_IN,
  stunServers: asList(raw.STUN_SERVERS),
  turn: raw.TURN_SERVER_URL
    ? {
        urls: asList(raw.TURN_SERVER_URL),
        username: raw.TURN_USERNAME ?? "",
        credential: raw.TURN_PASSWORD ?? "",
      }
    : null,
  asr: {
    provider: raw.ASR_PROVIDER,
    apiKey: raw.ASR_API_KEY,
    apiUrl: raw.ASR_API_URL,
  },
  translation: {
    provider: raw.TRANSLATION_PROVIDER,
    apiKey: raw.TRANSLATION_API_KEY,
    apiUrl: raw.TRANSLATION_API_URL,
    model: raw.TRANSLATION_MODEL,
  },
  tts: {
    provider: raw.TTS_PROVIDER,
    apiKey: raw.TTS_API_KEY,
    apiUrl: raw.TTS_API_URL,
  },
  termAssist: {
    provider: raw.TERM_ASSIST_PROVIDER,
    apiKey: raw.TERM_ASSIST_API_KEY,
  },
  allowGuestJoin: raw.ALLOW_GUEST_JOIN,
  rateLimit: {
    windowMs: raw.RATE_LIMIT_WINDOW_MS,
    max: raw.RATE_LIMIT_MAX,
  },
} as const;

if (env.isProduction && env.jwtSecret === "nexclass-development-secret-change-me") {
  // eslint-disable-next-line no-console
  console.error("Refusing to start: JWT_SECRET must be changed in production.");
  process.exit(1);
}
