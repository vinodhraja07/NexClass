import type { LanguageCode } from "@nexclass/shared";
import { env } from "../config/env";

/* ------------------------------------------------------------------ *
 * Provider neutral adapter interfaces.
 * Adding a new provider means implementing one interface and registering
 * it below - no application code has to change.
 * ------------------------------------------------------------------ */

export interface TranslationRequest {
  text: string;
  source: LanguageCode;
  target: LanguageCode;
}

export interface TranslationResult {
  text: string;
  provider: string;
  latencyMs: number;
}

export interface TranslationAdapter {
  readonly name: string;
  readonly label: string;
  isConfigured(): boolean;
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

export interface TtsRequest {
  text: string;
  language: LanguageCode;
  voice?: string;
}

export interface TtsResult {
  /** A playable audio URL (may be a data URL for providers that return bytes). */
  audioUrl: string;
  provider: string;
  latencyMs: number;
  durationMs?: number | null;
}

export interface TtsAdapter {
  readonly name: string;
  readonly label: string;
  isConfigured(): boolean;
  synthesize(request: TtsRequest): Promise<TtsResult>;
}

export interface AsrAdapter {
  readonly name: string;
  readonly label: string;
  isConfigured(): boolean;
  /** Human readable description of where recognition happens. */
  describe(): string;
}

const now = () => Date.now();

/* ---------------------------- Translation ---------------------------- */

class GoogleTranslationAdapter implements TranslationAdapter {
  readonly name = "google";
  readonly label = "Google Cloud Translation v2";
  isConfigured() {
    return Boolean(env.translation.apiKey && env.translation.apiUrl);
  }
  async translate({ text, source, target }: TranslationRequest): Promise<TranslationResult> {
    const started = now();
    const url = new URL(env.translation.apiUrl!);
    url.searchParams.set("key", env.translation.apiKey!);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
    });
    if (!response.ok) {
      throw new Error(`Google translation failed with status ${response.status}.`);
    }
    const data = (await response.json()) as { data?: { translations?: { translatedText?: string }[] } };
    const translated = data.data?.translations?.[0]?.translatedText;
    if (!translated) throw new Error("Google translation returned an empty payload.");
    return { text: translated, provider: this.name, latencyMs: now() - started };
  }
}

class DeepLTranslationAdapter implements TranslationAdapter {
  readonly name = "deepl";
  readonly label = "DeepL API";
  isConfigured() {
    return Boolean(env.translation.apiKey && env.translation.apiUrl);
  }
  async translate({ text, source, target }: TranslationRequest): Promise<TranslationResult> {
    const started = now();
    const response = await fetch(env.translation.apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `DeepL-Auth-Key ${env.translation.apiKey}`,
      },
      body: new URLSearchParams({
        text,
        source_language: source.toUpperCase(),
        target_language: target.toUpperCase(),
      }),
    });
    if (!response.ok) {
      throw new Error(`DeepL translation failed with status ${response.status}.`);
    }
    const data = (await response.json()) as { translations?: { text?: string }[] };
    const translated = data.translations?.[0]?.text;
    if (!translated) throw new Error("DeepL translation returned an empty payload.");
    return { text: translated, provider: this.name, latencyMs: now() - started };
  }
}

/**
 * IndicTrans2 / AI4Bharat adapter.
 *
 * IndicTrans2 is an open-source model - there is no official hosted API with
 * a free key. It is normally run behind your own HTTP service. The contract
 * implemented here matches the official IndicTrans2 "Translate API":
 *   POST {TRANSLATION_API_URL}/translate  { text, src_lang, tgt_lang }
 *   ->  { translated_text: "..." }
 * See documentation/API_SETUP.md for how to self-host it.
 */
class IndicTrans2Adapter implements TranslationAdapter {
  readonly name = "indictrans2";
  readonly label = "IndicTrans2 (self-hosted, AI4Bharat)";
  isConfigured() {
    return Boolean(env.translation.apiUrl);
  }
  async translate({ text, source, target }: TranslationRequest): Promise<TranslationResult> {
    const started = now();
    const base = env.translation.apiUrl!.replace(/\/$/, "");
    const response = await fetch(`${base}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.translation.apiKey ? { Authorization: `Bearer ${env.translation.apiKey}` } : {}),
      },
      body: JSON.stringify({ text, src_lang: source, tgt_lang: target }),
    });
    if (!response.ok) {
      throw new Error(`IndicTrans2 translation failed with status ${response.status}.`);
    }
    const data = (await response.json()) as { translated_text?: string; translatedText?: string };
    const translated = data.translated_text ?? data.translatedText;
    if (!translated) throw new Error("IndicTrans2 returned an empty payload.");
    return { text: translated, provider: this.name, latencyMs: now() - started };
  }
}

/**
 * Generic JSON translation adapter for any self-hosted engine.
 * POST { url } { text, source, target } -> { translatedText | translation | text }
 */
class GenericHttpTranslationAdapter implements TranslationAdapter {
  readonly name = "generic-http";
  readonly label = "Generic HTTP translation service";
  isConfigured() {
    return Boolean(env.translation.apiUrl);
  }
  async translate({ text, source, target }: TranslationRequest): Promise<TranslationResult> {
    const started = now();
    const response = await fetch(env.translation.apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.translation.apiKey ? { Authorization: `Bearer ${env.translation.apiKey}` } : {}),
      },
      body: JSON.stringify({ text, source, target }),
    });
    if (!response.ok) {
      throw new Error(`Translation service failed with status ${response.status}.`);
    }
    const data = (await response.json()) as Record<string, unknown>;
    const translated =
      (data.translatedText as string) ?? (data.translation as string) ?? (data.text as string);
    if (!translated) throw new Error("Translation service returned an empty payload.");
    return { text: translated, provider: this.name, latencyMs: now() - started };
  }
}

/* -------------------------------- TTS -------------------------------- */

class GoogleCloudTtsAdapter implements TtsAdapter {
  readonly name = "google-tts";
  readonly label = "Google Cloud Text-to-Speech";
  isConfigured() {
    return Boolean(env.tts.apiKey && env.tts.apiUrl);
  }
  async synthesize({ text, language, voice }: TtsRequest): Promise<TtsResult> {
    const started = now();
    const url = new URL(env.tts.apiUrl!);
    url.searchParams.set("key", env.tts.apiKey!);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: `${language}-IN`,
          name: voice ?? defaultGoogleVoice(language),
        },
        audioConfig: { audioEncoding: "MP3" },
      }),
    });
    if (!response.ok) {
      throw new Error(`Google TTS failed with status ${response.status}.`);
    }
    const data = (await response.json()) as { audioContent?: string };
    if (!data.audioContent) throw new Error("Google TTS returned no audio.");
    return {
      audioUrl: `data:audio/mp3;base64,${data.audioContent}`,
      provider: this.name,
      latencyMs: now() - started,
    };
  }
}

class AzureTtsAdapter implements TtsAdapter {
  readonly name = "azure-tts";
  readonly label = "Azure Cognitive Services Speech";
  isConfigured() {
    return Boolean(env.tts.apiKey && env.tts.apiUrl);
  }
  async synthesize({ text, language, voice }: TtsRequest): Promise<TtsResult> {
    const started = now();
    const url = new URL(env.tts.apiUrl!);
    url.searchParams.set("key", env.tts.apiKey!);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        ...(voice ? { "X-Microsoft-VoiceName": voice } : {}),
      },
      body: `<speak version="1.0" xml:lang="${language}-IN"><voice name="${voice ?? defaultGoogleVoice(language)}">${escapeXml(text)}</voice></speak>`,
    });
    if (!response.ok) {
      throw new Error(`Azure TTS failed with status ${response.status}.`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      audioUrl: `data:audio/mp3;base64,${buffer.toString("base64")}`,
      provider: this.name,
      latencyMs: now() - started,
    };
  }
}

class GenericHttpTtsAdapter implements TtsAdapter {
  readonly name = "generic-tts";
  readonly label = "Generic HTTP speech service";
  isConfigured() {
    return Boolean(env.tts.apiUrl);
  }
  async synthesize({ text, language }: TtsRequest): Promise<TtsResult> {
    const started = now();
    const response = await fetch(env.tts.apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.tts.apiKey ? { Authorization: `Bearer ${env.tts.apiKey}` } : {}),
      },
      body: JSON.stringify({ text, language }),
    });
    if (!response.ok) {
      throw new Error(`Speech service failed with status ${response.status}.`);
    }
    const data = (await response.json()) as { audioUrl?: string; url?: string };
    const audioUrl = data.audioUrl ?? data.url;
    if (!audioUrl) throw new Error("Speech service returned no audio URL.");
    return { audioUrl, provider: this.name, latencyMs: now() - started };
  }
}

/* -------------------------------- ASR -------------------------------- */

class BrowserAsrAdapter implements AsrAdapter {
  readonly name = "browser";
  readonly label = "Browser Web Speech API (in-browser recognition)";
  isConfigured() {
    return true;
  }
  describe() {
    return "Recognition runs in the participant's browser using the Web Speech API. No server key required.";
  }
}

class RemoteAsrAdapter implements AsrAdapter {
  readonly name = "remote-asr";
  readonly label = "Remote ASR service";
  isConfigured() {
    return Boolean(env.asr.apiUrl);
  }
  describe() {
    return "Audio is posted to the configured remote ASR endpoint for recognition.";
  }
}

/* --------------------------- Registry ------------------------------- */

const fallbackTtsCache = new Map<string, TtsResult>();
const FALLBACK_TTS_CACHE_MAX = 150;
/** The public Google Translate speech endpoint rejects queries longer than this. */
const FALLBACK_TTS_CHUNK = 180;

function splitForFallbackTts(text: string): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0 || words[0] === "") return [];
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && `${current} ${word}`.length > FALLBACK_TTS_CHUNK) {
      chunks.push(current);
      current = word;
      continue;
    }
    current = current ? `${current} ${word}` : word;
  }
  if (current) chunks.push(current);
  return chunks;
}

class GoogleTranslateTtsFallbackAdapter implements TtsAdapter {
  readonly name = "google-translate-tts-fallback";
  readonly label = "Keyless fallback voice (Google Translate speech endpoint)";

  isConfigured() {
    return true;
  }

  /**
   * Zero-key voice for the languages the Google Translate speech endpoint
   * supports (verified live: en, ta, hi, bn, mr). Some languages of the app,
   * including Odia, are rejected by that endpoint with HTTP 400 - on failure
   * the caller records a failed voice and the browser synthesis chain takes
   * over, never pretending audio exists.
   */
  async synthesize(request: TtsRequest): Promise<TtsResult> {
    const cacheKey = `${request.language}:${request.text}`;
    const cached = fallbackTtsCache.get(cacheKey);
    if (cached) return cached;

    const chunks = splitForFallbackTts(request.text);
    if (chunks.length === 0) throw new Error("There is no text to synthesize.");

    const started = now();
    const parts: Buffer[] = [];
    for (let index = 0; index < chunks.length; index += 1) {
      const url =
        "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob" +
        `&tl=${encodeURIComponent(request.language)}` +
        `&total=${chunks.length}&idx=${index}&textlen=${chunks[index].length}` +
        `&q=${encodeURIComponent(chunks[index])}`;
      const response = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          referer: "https://translate.google.com/",
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(
          `Fallback voice request failed (HTTP ${response.status})` +
            (response.status === 400 ? ` - the endpoint does not support "${request.language}".` : "."),
        );
      }
      parts.push(Buffer.from(await response.arrayBuffer()));
    }

    const result: TtsResult = {
      audioUrl: `data:audio/mpeg;base64,${Buffer.concat(parts).toString("base64")}`,
      provider: this.name,
      latencyMs: now() - started,
    };
    fallbackTtsCache.set(cacheKey, result);
    if (fallbackTtsCache.size > FALLBACK_TTS_CACHE_MAX) {
      fallbackTtsCache.delete(fallbackTtsCache.keys().next().value as string);
    }
    return result;
  }
}

/** Exposed for the demo speech route: keyless voice for prepared samples. */
export function synthesizeFallbackSpeech(request: TtsRequest): Promise<TtsResult> {
  return new GoogleTranslateTtsFallbackAdapter().synthesize(request);
}

const translationAdapters: Record<string, TranslationAdapter> = {
  google: new GoogleTranslationAdapter(),
  deepl: new DeepLTranslationAdapter(),
  indictrans2: new IndicTrans2Adapter(),
  "generic-http": new GenericHttpTranslationAdapter(),
};

const ttsAdapters: Record<string, TtsAdapter> = {
  "google-tts": new GoogleCloudTtsAdapter(),
  "azure-tts": new AzureTtsAdapter(),
  "generic-tts": new GenericHttpTtsAdapter(),
};

const fallbackTtsAdapter: TtsAdapter = new GoogleTranslateTtsFallbackAdapter();

const asrAdapters: Record<string, AsrAdapter> = {
  browser: new BrowserAsrAdapter(),
  "remote-asr": new RemoteAsrAdapter(),
};

export function getTranslationAdapter(): TranslationAdapter | null {
  const name = env.translation.provider.toLowerCase();
  const adapter = translationAdapters[name];
  return adapter && adapter.isConfigured() ? adapter : null;
}

export function getTtsAdapter(): TtsAdapter | null {
  const name = env.tts.provider.toLowerCase();
  // "none" turns server voice synthesis off completely (clients fall back to
  // their own browser voice). Any configured provider wins; otherwise the
  // keyless fallback voice keeps every language audible.
  if (name === "none" || name === "disabled" || name === "off") return null;
  const adapter = ttsAdapters[name];
  if (adapter && adapter.isConfigured()) return adapter;
  return fallbackTtsAdapter;
}

export function getAsrAdapter(): AsrAdapter {
  const name = env.asr.provider.toLowerCase();
  return asrAdapters[name] ?? asrAdapters.browser;
}

export function translationProviderInfo() {
  const name = env.translation.provider.toLowerCase();
  const adapter = translationAdapters[name];
  const configured = Boolean(adapter?.isConfigured());
  return {
    provider: name,
    label: adapter?.label ?? "No translation provider configured",
    configured,
  };
}

export function ttsProviderInfo() {
  const name = env.tts.provider.toLowerCase();
  if (name === "none" || name === "disabled" || name === "off") {
    return { provider: name, label: "Server voice disabled", configured: false };
  }
  const adapter = ttsAdapters[name];
  if (adapter && adapter.isConfigured()) {
    return { provider: name, label: adapter.label, configured: true };
  }
  return {
    provider: fallbackTtsAdapter.name,
    label: fallbackTtsAdapter.label,
    configured: true,
  };
}

export function asrProviderInfo() {
  const adapter = getAsrAdapter();
  return {
    provider: adapter.name,
    label: adapter.label,
    configured: adapter.isConfigured(),
    describe: adapter.describe(),
  };
}

function defaultGoogleVoice(language: LanguageCode): string {
  const voices: Record<LanguageCode, string> = {
    en: "en-IN-Neural2-A",
    ta: "ta-IN-Neural2-A",
    hi: "hi-IN-Neural2-A",
    bn: "bn-IN-Neural2-A",
    mr: "mr-IN-Neural2-A",
    or: "or-IN-Neural2-A",
  };
  return voices[language] ?? "en-IN-Neural2-A";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
