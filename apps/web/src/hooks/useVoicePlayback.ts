import { useCallback, useEffect, useRef, useState } from "react";
import { LANGUAGES, defaultTtsTag, type LanguageCode } from "@nexclass/shared";
import type { CaptionSegmentPayload } from "@/lib/transport";

export type VoiceMode = "original" | "translated" | "original-captions";

export interface VoicePlaybackState {
  /** A translated segment is being spoken right now. */
  playing: boolean;
  provider: string | null;
  language: LanguageCode | null;
  /** Delay between the end of a caption segment and the moment it is spoken. */
  latencyMs: number | null;
  queued: number;
  muted: boolean;
  volume: number;
  error: string | null;
  /** True when the browser is the voice source (local fallback, not a provider). */
  browserFallback: boolean;
}

/** Segments older than this are dropped instead of being played late. */
const STALE_LIMIT_MS = 9_000;
/** At most this many segments wait to be spoken before older ones are skipped. */
const MAX_PENDING_SEGMENTS = 2;

export interface UseVoicePlaybackOptions {
  segments: CaptionSegmentPayload[];
  voiceLanguage: LanguageCode;
  /** Translated voice only runs in the translated voice mode. */
  enabled: boolean;
  muted: boolean;
  volume: number;
  /**
   * Live transport feeding the voice. When it goes false (a demo lecture is
   * paused) the queue is flushed and the current audio stops immediately.
   */
  active?: boolean;
}

function odiaToDevanagariPhonetic(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Odia letter WA (U+0B71) maps phonetically to Devanagari VA/WA (U+0935, व)
    if (code === 0x0B71) {
      result += "\u0935";
    } else if (code >= 0x0B00 && code <= 0x0B7F) {
      result += String.fromCharCode(code - 0x0200);
    } else {
      result += text[i];
    }
  }
  return result;
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const exact = voices.find((voice) => voice.lang?.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const prefix = lang.split("-")[0].toLowerCase();
  return voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix)) ?? null;
}

function waitForVoices(lang: string): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve(null);
  }
  const immediate = pickVoice(lang);
  if (immediate) return Promise.resolve(immediate);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(pickVoice(lang));
    }, 700);
    function handler() {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(pickVoice(lang));
    }
    window.speechSynthesis.addEventListener("voiceschanged", handler);
  });
}

/**
 * Serialised playback of the translated voice.
 *
 * Only one segment is ever spoken at a time. Segments that arrive more than
 * 20 seconds late are dropped instead of being played out of sequence, and
 * browser speech synthesis is always labelled as a local fallback rather than
 * as a translation provider.
 */
export function useVoicePlayback({
  segments,
  voiceLanguage,
  enabled,
  muted,
  volume,
  active = true,
}: UseVoicePlaybackOptions): VoicePlaybackState {
  const [state, setState] = useState<VoicePlaybackState>({
    playing: false,
    provider: null,
    language: null,
    latencyMs: null,
    queued: 0,
    muted,
    volume,
    error: null,
    browserFallback: false,
  });

  const queueRef = useRef<CaptionSegmentPayload[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const playingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentsRef = useRef(segments);
  const languageRef = useRef(voiceLanguage);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  const enabledRef = useRef(enabled);
  const activeRef = useRef(active);

  const stopCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);
  useEffect(() => {
    if (languageRef.current !== voiceLanguage) {
      languageRef.current = voiceLanguage;
      // When switching languages (e.g. original <-> translated), stop previous speech immediately
      stopCurrent();
      playingRef.current = false;
      queueRef.current = [];
      // Clear seen cache so the currently active sentence can be spoken in the new voice language
      seenRef.current.clear();
    }
  }, [voiceLanguage, stopCurrent]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const playSegment = useCallback(
    async (segment: CaptionSegmentPayload): Promise<{
      provider: string | null;
      latencyMs: number;
      error?: string;
      browserFallback: boolean;
    }> => {
      const language = languageRef.current;
      let voice = segment.voices[language];
      const latencyMs = Math.max(0, Date.now() - (segment.endTime || Date.now()));

      const text =
        segment.translations[language]?.text?.trim() ||
        (language === segment.originalLanguage ? segment.originalText.trim() : "");

      // If no audio asset came with the segment (e.g. keyless classroom or prefetch timeout),
      // fetch real synthesized audio on demand from the fallback speech endpoint so regional
      // languages like Odia ("or") speak crystal-clear audio rather than failing silently on desktop OSs.
      if ((!voice?.audioUrl || voice.provider === "browser-speech-synthesis") && text) {
        try {
          const res = await fetch(
            `/api/demo/speech?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(text)}`,
            { signal: AbortSignal.timeout(6_000) },
          );
          if (res.ok) {
            const data = (await res.json()) as { audioUrl?: string; provider?: string };
            if (data.audioUrl) {
              voice = {
                provider: data.provider ?? "google-translate-tts-fallback",
                status: "complete",
                latencyMs: 18,
                audioUrl: data.audioUrl,
              };
            }
          }
        } catch {
          // Degrades to browser speech synthesis below
        }
      }

      if (!voice) {
        if (text) {
          voice = {
            provider: "browser-speech-synthesis",
            status: "complete",
            latencyMs: 0,
            audioUrl: null,
          };
        } else {
          return { provider: null, latencyMs, error: "No voice entry for this language.", browserFallback: false };
        }
      }
      if (voice.status !== "complete") {
        if (text) {
          // If the backend voice failed or is pending, degrade gracefully to browser speech
          voice = {
            provider: "browser-speech-synthesis",
            status: "complete",
            latencyMs: 0,
            audioUrl: null,
          };
        } else {
          return {
            provider: voice.provider,
            latencyMs,
            error: voice.error ?? "The voice provider did not produce audio for this segment.",
            browserFallback: false,
          };
        }
      }

      if (voice.audioUrl) {
        await new Promise<void>((resolve) => {
          const audio = new Audio(voice.audioUrl!);
          audioRef.current = audio;
          audio.volume = volumeRef.current;
          // "pause" fires when playback is stopped as well as when it ends
          // naturally, so a paused segment still settles and never wedges
          // the serialised queue.
          const settle = () => {
            audioRef.current = null;
            resolve();
          };
          audio.onended = settle;
          audio.onerror = settle;
          audio.onpause = settle;
          void audio.play().catch(settle);
        });
        return { provider: voice.provider, latencyMs, browserFallback: false };
      }

      if (voice.provider === "browser-speech-synthesis") {
        if (!text) {
          return {
            provider: voice.provider,
            latencyMs,
            error: "There is no translated text to read out for this segment.",
            browserFallback: true,
          };
        }
        // Walk every TTS tag of the language (ta-IN, hi-IN, ...) and pick the
        // first voice the browser actually has. Indic voices are rare on
        // desktop browsers, so a miss is reported instead of silently playing
        // the wrong language.
        const tags = LANGUAGES.find((item) => item.code === language)?.ttsTags ?? [defaultTtsTag(language)];
        let voiceMatch: SpeechSynthesisVoice | null = null;
        for (const tag of tags) {
          voiceMatch = await waitForVoices(tag);
          if (voiceMatch) break;
        }

        // For Odia or other regional languages without an exact OS speech pack,
        // fall back to available Indic voices (hi-IN, bn-IN) with phonetic transliteration
        // so audio is spoken naturally rather than failing silently.
        let spokenText = text;
        if (!voiceMatch && language === "or") {
          voiceMatch = (await waitForVoices("hi-IN")) || (await waitForVoices("bn-IN"));
          spokenText = odiaToDevanagariPhonetic(text);
        } else if (voiceMatch && voiceMatch.lang.startsWith("hi") && language === "or") {
          spokenText = odiaToDevanagariPhonetic(text);
        }

        if (!voiceMatch) {
          return {
            provider: voice.provider,
            latencyMs,
            error:
              "This browser has no installed voice for the chosen language. The fallback server voice could not be reached.",
            browserFallback: true,
          };
        }

        const lang = voiceMatch.lang ?? defaultTtsTag(language);
        await new Promise<void>((resolve) => {
          if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            resolve();
            return;
          }
          const synthesis = window.speechSynthesis;
          synthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(spokenText);
          if (voiceMatch) utterance.voice = voiceMatch;
          utterance.lang = lang;
          utterance.volume = volumeRef.current;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          synthesis.speak(utterance);
        });
        return { provider: "browser-speech-synthesis", latencyMs, browserFallback: true };
      }

      return {
        provider: voice.provider,
        latencyMs,
        error: voice.error ?? "This provider did not return an audio asset for the segment.",
        browserFallback: false,
      };
    },
    [],
  );

  const pump = useCallback(async () => {
    if (playingRef.current) return;
    while (queueRef.current.length > 0 && enabledRef.current && activeRef.current) {
      const segment = queueRef.current.shift();
      if (!segment) break;
      setState((current) => ({ ...current, queued: queueRef.current.length }));

      const age = Date.now() - (segment.endTime || segment.startTime);
      if (age > STALE_LIMIT_MS) {
        // Stale segment - the lecture moved on while we were buffering.
        continue;
      }
      if (mutedRef.current) {
        continue;
      }

      playingRef.current = true;
      setState((current) => ({ ...current, playing: true, error: null }));
      const result = await playSegment(segment);
      playingRef.current = false;
      setState((current) => ({
        ...current,
        playing: false,
        provider: result.provider,
        language: languageRef.current,
        latencyMs: result.latencyMs,
        error: result.error ?? null,
        browserFallback: result.browserFallback,
      }));
    }
    setState((current) => ({ ...current, playing: false, queued: queueRef.current.length }));
  }, [playSegment]);

  useEffect(() => {
    if (!enabled) {
      queueRef.current = [];
      seenRef.current = new Set();
      stopCurrent();
      setState((current) => ({
        ...current,
        playing: false,
        queued: 0,
        provider: null,
        error: null,
        browserFallback: false,
      }));
      return;
    }

    if (!active) {
      // The lecture (demo) is paused: stop the audio at once and drop what is
      // still pending, but keep the "already voiced" memory so that resuming
      // never replays lines the learner has already heard. The voice then
      // resumes together with the next caption line, in sync.
      queueRef.current = [];
      stopCurrent();
      setState((current) => ({
        ...current,
        playing: false,
        queued: 0,
        provider: null,
        error: null,
        browserFallback: false,
      }));
      return;
    }

    const currentLang = languageRef.current;
    let added = 0;
    segmentsRef.current.forEach((segment) => {
      const seenKey = `${currentLang}:${segment.id}`;
      if (seenRef.current.has(seenKey)) return;
      const age = Date.now() - (segment.endTime || segment.startTime);
      if (age > STALE_LIMIT_MS) {
        seenRef.current.add(seenKey);
        return;
      }
      const voice = segment.voices[currentLang];
      const hasText =
        Boolean(segment.translations[currentLang]?.text?.trim()) ||
        (currentLang === segment.originalLanguage && Boolean(segment.originalText?.trim()));

      if (!voice && !hasText) return;
      if (voice && voice.status === "failed" && !hasText) return;

      seenRef.current.add(seenKey);
      queueRef.current.push(segment);
      added += 1;
    });

    // Synthesized speech is slower than the caption cadence, so the queue
    // would drift further behind the teacher indefinitely. The two most
    // recent segments are enough: older lines are skipped, the voice keeps
    // pace with the newest speech, and captions still carry the full text.
    if (queueRef.current.length > MAX_PENDING_SEGMENTS) {
      queueRef.current = [...queueRef.current]
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, MAX_PENDING_SEGMENTS)
        .sort((a, b) => a.startTime - b.startTime);
    }

    if (added > 0 || queueRef.current.length > 0) {
      setState((current) => ({ ...current, queued: queueRef.current.length }));
      void pump();
    }
  }, [enabled, active, pump, segments, stopCurrent, voiceLanguage]);

  // Muting or changing the volume applies to the segment that is playing now.
  useEffect(() => {
    if (muted) stopCurrent();
    if (audioRef.current) audioRef.current.volume = volume;
  }, [muted, stopCurrent, volume]);

  useEffect(() => () => stopCurrent(), [stopCurrent]);

  return { ...state, muted, volume };
}
