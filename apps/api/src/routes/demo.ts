import { Router } from "express";
import { DEMO_SEGMENTS, DEMO_STUDENTS, LANGUAGES, type LanguageCode } from "@nexclass/shared";
import { synthesizeFallbackSpeech } from "../services/providers";

const router = Router();

/**
 * The interactive demo is a first-class part of the product. It runs on
 * prepared sample lecture segments so an evaluator can experience the whole
 * multilingual flow without any external API key.
 */
router.get("/segments", (_req, res) => {
  res.json({
    simulated: true,
    notice:
      "Prepared sample lecture content. Translations are hand-authored demo samples, not live AI translations.",
    segments: DEMO_SEGMENTS,
    students: DEMO_STUDENTS,
  });
});

/**
 * Keyless demo voice: synthesizes a translated sample line so the demo can
 * play real audio in every supported language, including Odia, without any
 * provider configuration. Uses the same zero-key fallback voice as the live
 * classroom when no TTS provider is configured.
 */
router.get("/speech", async (req, res) => {
  const language = String(req.query.lang ?? "") as LanguageCode;
  const text = String(req.query.text ?? "").trim();
  if (!LANGUAGES.some((item) => item.code === language)) {
    res.status(400).json({ error: "unsupported_language", message: "Unsupported voice language." });
    return;
  }
  if (!text || text.length > 600) {
    res.status(400).json({ error: "invalid_text", message: "Provide 1-600 characters of text." });
    return;
  }
  try {
    const result = await synthesizeFallbackSpeech({ text, language });
    res.json({ provider: result.provider, latencyMs: result.latencyMs, audioUrl: result.audioUrl });
  } catch (error) {
    res.status(502).json({
      error: "voice_unavailable",
      message: error instanceof Error ? error.message : "The fallback voice could not be reached.",
    });
  }
});

export default router;
