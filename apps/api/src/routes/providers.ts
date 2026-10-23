import { Router } from "express";
import { LANGUAGES } from "@nexclass/shared";
import { asrProviderInfo, ttsProviderInfo, translationProviderInfo } from "../services/providers";
import { env } from "../config/env";
import { mongoStatus } from "../db/mongo";
import { cacheStatus } from "../db/redis";
import { glossaryStats } from "@nexclass/terminology";

const router = Router();

/**
 * Truthful status of every external integration. The classroom uses this to
 * show an honest "unavailable" state instead of pretending a provider works.
 */
router.get("/status", (_req, res) => {
  const asr = asrProviderInfo();
  const translation = translationProviderInfo();
  const tts = ttsProviderInfo();

  res.json({
    providers: [
      {
        category: "asr",
        configured: asr.configured,
        provider: asr.provider,
        detail: asr.describe,
        envVars: ["ASR_PROVIDER", "ASR_API_KEY", "ASR_API_URL"],
      },
      {
        category: "translation",
        configured: translation.configured,
        provider: translation.provider,
        detail: translation.configured
          ? `${translation.label} is ready.`
          : "No translation provider is configured - captions stay in the original language and translated voice is unavailable.",
        envVars: ["TRANSLATION_PROVIDER", "TRANSLATION_API_KEY", "TRANSLATION_API_URL"],
      },
      {
        category: "tts",
        configured: tts.configured,
        provider: tts.provider,
        detail: tts.configured
          ? `${tts.label} is ready.`
          : "No server-side TTS provider is configured - the browser can speak translated captions locally and the UI labels it as a local fallback.",
        envVars: ["TTS_PROVIDER", "TTS_API_KEY", "TTS_API_URL"],
      },
      {
        category: "turn",
        configured: Boolean(env.turn),
        provider: env.turn ? "configured" : "stun-only",
        detail: env.turn
          ? "A TURN relay is configured for participants behind restrictive NATs."
          : "STUN only. Some restrictive networks will fail to connect - configure TURN_SERVER_URL for production.",
        envVars: ["STUN_SERVERS", "TURN_SERVER_URL", "TURN_USERNAME", "TURN_PASSWORD"],
      },
    ],
    languages: LANGUAGES.map((lang) => lang.code),
    terminology: glossaryStats(),
    infrastructure: {
      mongodb: mongoStatus(),
      redis: cacheStatus(),
    },
    demoMode: true,
    serverTime: new Date().toISOString(),
  });
});

export default router;
