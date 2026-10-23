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
  /** Immediately halt and cancel all audio and speech synthesis playback. */
  stop: () => void;
}

/** Segments older than this are dropped instead of being played late. */
const STALE_LIMIT_MS = 9_000;
/** At most this many segments wait to be spoken before older ones are skipped. */
const MAX_PENDING_SEGMENTS = 2;

export interface UseVoicePlaybackOptions {
  segments: CaptionSegmentPayload[];
  voiceLanguage: LanguageCode;
  /** Optional audio voice mode (e.g. original vs translated) to detect mode changes */
  voiceMode?: VoiceMode;
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

function waitForVoices(
  lang: string,
  generation: number,
  generationRef: React.MutableRefObject<number>,
  timerRef: React.MutableRefObject<number | null>,
  cleanupRef: React.MutableRefObject<(() => void) | null>,
): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve(null);
  }
  if (generation !== generationRef.current) {
    return Promise.resolve(null);
  }
  const immediate = pickVoice(lang);
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
      } catch {
        /* ignore */
      }
      cleanupRef.current = null;
    };

    function handler() {
      cleanup();
      if (generation !== generationRef.current) {
        resolve(null);
      } else {
        resolve(pickVoice(lang));
      }
    }

    cleanupRef.current = () => {
      cleanup();
      resolve(null);
    };

    timerRef.current = window.setTimeout(() => {
      cleanup();
      if (generation !== generationRef.current) {
        resolve(null);
      } else {
        resolve(pickVoice(lang));
      }
    }, 700);

    window.speechSynthesis.addEventListener("voiceschanged", handler);
  });
}

/**
 * Serialised playback of the translated voice.
 *
 * Only one segment is ever spoken at a time. When language or audio mode changes,
 * any currently playing audio (HTMLAudioElement, AudioContext, speech synthesis)
 * is immediately stopped and discarded, and pending queues are flushed cleanly
 * so that no overlapping audio tracks ever play concurrently.
 */
export function useVoicePlayback({
  segments,
  voiceLanguage,
  voiceMode,
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
    stop: () => undefined,
  });

  const queueRef = useRef<CaptionSegmentPayload[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const playingRef = useRef(false);
  const pumpRunningRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voiceWaitTimerRef = useRef<number | null>(null);
  const voiceWaitCleanupRef = useRef<(() => void) | null>(null);
  const cancelActivePlaybackRef = useRef<(() => void) | null>(null);
  const activeSegmentRef = useRef<CaptionSegmentPayload | null>(null);
  const playbackGenerationRef = useRef(0);

  const segmentsRef = useRef(segments);
  const languageRef = useRef(voiceLanguage);
  const voiceModeRef = useRef(voiceMode);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  const enabledRef = useRef(enabled);
  const activeRef = useRef(active);

  const stopAllAudio = useCallback(() => {
    // 1. Advance playback generation to invalidate in-flight async operations
    playbackGenerationRef.current += 1;

    // 2. Immediately resolve any pending playback promise to prevent hanging async pumps
    if (cancelActivePlaybackRef.current) {
      try {
        cancelActivePlaybackRef.current();
      } catch {
        /* ignore */
      }
      cancelActivePlaybackRef.current = null;
    }

    // 3. Abort any active speech network fetch
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        /* ignore */
      }
      abortControllerRef.current = null;
    }

    // 4. Cancel any pending voice resolution wait timer or listener
    if (voiceWaitTimerRef.current !== null) {
      window.clearTimeout(voiceWaitTimerRef.current);
      voiceWaitTimerRef.current = null;
    }
    if (voiceWaitCleanupRef.current) {
      try {
        voiceWaitCleanupRef.current();
      } catch {
        /* ignore */
      }
      voiceWaitCleanupRef.current = null;
    }

    // 5. Immediately pause, detach listeners, clear src, and discard HTMLAudioElement
    if (audioRef.current) {
      const audio = audioRef.current;
      audioRef.current = null;
      audio.onended = null;
      audio.onerror = null;
      audio.onpause = null;
      audio.oncanplay = null;
      audio.onplaying = null;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      try {
        audio.removeAttribute("src");
        audio.src = "";
        audio.load();
      } catch {
        /* ignore */
      }
    }

    // 6. Cancel Web SpeechSynthesis immediately and discard active utterance
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }

    // 7. If any global AudioContext was registered, ensure it is suspended
    if (typeof window !== "undefined") {
      const globalCtx = (window as unknown as { __nexclass_audio_ctx__?: AudioContext }).__nexclass_audio_ctx__;
      if (globalCtx && globalCtx.state !== "closed") {
        try {
          void globalCtx.suspend();
        } catch {
          /* ignore */
        }
      }
    }

    // 8. Cleanly flush queue and active segment references
    queueRef.current = [];
    activeSegmentRef.current = null;
    playingRef.current = false;
  }, []);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);
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
    async (
      segment: CaptionSegmentPayload,
      generation: number,
    ): Promise<{
      provider: string | null;
      latencyMs: number;
      error?: string;
      browserFallback: boolean;
    }> => {
      if (generation !== playbackGenerationRef.current) {
        return { provider: null, latencyMs: 0, browserFallback: false };
      }

      const language = languageRef.current;
      let voice = segment.voices[language];
      const latencyMs = Math.max(0, Date.now() - (segment.endTime || Date.now()));

      const text =
        segment.translations[language]?.text?.trim() ||
        (language === segment.originalLanguage ? segment.originalText.trim() : "");

      // If no audio asset came with the segment (e.g. keyless classroom or prefetch timeout),
      // fetch real synthesized audio on demand from the fallback speech endpoint.
      if ((!voice?.audioUrl || voice.provider === "browser-speech-synthesis") && text) {
        try {
          const controller = new AbortController();
          abortControllerRef.current = controller;
          const res = await fetch(
            `/api/demo/speech?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(text)}`,
            { signal: controller.signal },
          );
          if (generation !== playbackGenerationRef.current) {
            return { provider: null, latencyMs, browserFallback: false };
          }
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
        } finally {
          abortControllerRef.current = null;
        }
      }

      if (generation !== playbackGenerationRef.current) {
        return { provider: null, latencyMs, browserFallback: false };
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
          if (generation !== playbackGenerationRef.current) {
            resolve();
            return;
          }

          const audio = new Audio(voice.audioUrl!);
          audioRef.current = audio;
          audio.volume = volumeRef.current;

          let settled = false;
          const settle = () => {
            if (settled) return;
            settled = true;
            cancelActivePlaybackRef.current = null;
            audio.onended = null;
            audio.onerror = null;
            audio.onpause = null;
            if (audioRef.current === audio) {
              audioRef.current = null;
            }
            resolve();
          };

          cancelActivePlaybackRef.current = () => {
            settle();
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

        if (generation !== playbackGenerationRef.current) {
          return { provider: voice.provider, latencyMs, browserFallback: true };
        }

        const tags = LANGUAGES.find((item) => item.code === language)?.ttsTags ?? [defaultTtsTag(language)];
        let voiceMatch: SpeechSynthesisVoice | null = null;
        for (const tag of tags) {
          if (generation !== playbackGenerationRef.current) break;
          voiceMatch = await waitForVoices(
            tag,
            generation,
            playbackGenerationRef,
            voiceWaitTimerRef,
            voiceWaitCleanupRef,
          );
          if (voiceMatch) break;
        }

        if (generation !== playbackGenerationRef.current) {
          return { provider: voice.provider, latencyMs, browserFallback: true };
        }

        let spokenText = text;
        if (!voiceMatch && language === "or") {
          voiceMatch =
            (await waitForVoices(
              "hi-IN",
              generation,
              playbackGenerationRef,
              voiceWaitTimerRef,
              voiceWaitCleanupRef,
            )) ||
            (await waitForVoices(
              "bn-IN",
              generation,
              playbackGenerationRef,
              voiceWaitTimerRef,
              voiceWaitCleanupRef,
            ));
          spokenText = odiaToDevanagariPhonetic(text);
        } else if (voiceMatch && voiceMatch.lang.startsWith("hi") && language === "or") {
          spokenText = odiaToDevanagariPhonetic(text);
        }

        if (generation !== playbackGenerationRef.current) {
          return { provider: voice.provider, latencyMs, browserFallback: true };
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
          if (
            generation !== playbackGenerationRef.current ||
            typeof window === "undefined" ||
            !("speechSynthesis" in window)
          ) {
            resolve();
            return;
          }

          const synthesis = window.speechSynthesis;
          try {
            synthesis.cancel();
          } catch {
            /* ignore */
          }

          const utterance = new SpeechSynthesisUtterance(spokenText);
          utteranceRef.current = utterance;
          if (voiceMatch) utterance.voice = voiceMatch;
          utterance.lang = lang;
          utterance.volume = volumeRef.current;

          let settled = false;
          const settle = () => {
            if (settled) return;
            settled = true;
            cancelActivePlaybackRef.current = null;
            utterance.onend = null;
            utterance.onerror = null;
            if (utteranceRef.current === utterance) {
              utteranceRef.current = null;
            }
            resolve();
          };

          cancelActivePlaybackRef.current = () => {
            settle();
          };

          utterance.onend = settle;
          utterance.onerror = settle;

          try {
            synthesis.speak(utterance);
          } catch {
            settle();
          }
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
    if (pumpRunningRef.current) return;
    pumpRunningRef.current = true;

    try {
      while (enabledRef.current && activeRef.current) {
        const currentGeneration = playbackGenerationRef.current;
        const segment = queueRef.current.shift();
        if (!segment) break;

        if (currentGeneration !== playbackGenerationRef.current) {
          continue;
        }

        setState((current) => ({ ...current, queued: queueRef.current.length }));

        const age = Date.now() - (segment.endTime || segment.startTime);
        if (age > STALE_LIMIT_MS) {
          continue;
        }
        if (mutedRef.current) {
          continue;
        }

        playingRef.current = true;
        activeSegmentRef.current = segment;
        setState((current) => ({ ...current, playing: true, error: null }));

        const result = await playSegment(segment, currentGeneration);

        if (currentGeneration !== playbackGenerationRef.current) {
          // Playback was cancelled or language changed during this segment;
          // continue loop to process newly queued segments without stale state bleed
          continue;
        }

        playingRef.current = false;
        activeSegmentRef.current = null;
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
    } finally {
      pumpRunningRef.current = false;
      playingRef.current = false;
      activeSegmentRef.current = null;
      setState((current) => ({
        ...current,
        playing: false,
        queued: queueRef.current.length,
      }));
    }
  }, [playSegment]);

  // When voice language or audio mode changes: immediately silence previous audio,
  // cancel speech synthesis, flush pending queues, and queue the active segment
  // in the newly selected language/mode without overlap.
  useEffect(() => {
    const langChanged = languageRef.current !== voiceLanguage;
    const modeChanged = voiceMode !== undefined && voiceModeRef.current !== voiceMode;

    if (langChanged || modeChanged) {
      languageRef.current = voiceLanguage;
      if (voiceMode !== undefined) {
        voiceModeRef.current = voiceMode;
      }

      // Immediately halt any currently playing or in-flight audio/speech
      stopAllAudio();

      setState((current) => ({
        ...current,
        playing: false,
        queued: 0,
        provider: null,
        error: null,
        browserFallback: false,
      }));

      // Find if there is a currently active segment in the lecture
      const now = Date.now();
      const currentLang = voiceLanguage;

      const currentActive = [...segmentsRef.current]
        .reverse()
        .find(
          (seg) =>
            now >= seg.startTime &&
            now <= (seg.endTime || seg.startTime + 6_000) + 2_500,
        );

      // Mark all past segments as seen for the new language so they never replay
      segmentsRef.current.forEach((seg) => {
        seenRef.current.add(`${currentLang}:${seg.id}`);
      });

      // If there is an active segment and playback is enabled and active, queue ONLY that segment
      if (currentActive && enabledRef.current && activeRef.current) {
        const voice = currentActive.voices[currentLang];
        const hasText =
          Boolean(currentActive.translations[currentLang]?.text?.trim()) ||
          (currentLang === currentActive.originalLanguage &&
            Boolean(currentActive.originalText?.trim()));

        if (hasText && (!voice || voice.status !== "failed")) {
          queueRef.current.push(currentActive);
          setState((current) => ({ ...current, queued: 1 }));
          void pump();
        }
      }
    }
  }, [voiceLanguage, voiceMode, stopAllAudio, pump]);

  // Manage incoming segments and enabled/active toggles
  useEffect(() => {
    if (!enabled) {
      stopAllAudio();
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
      // The lecture is paused: stop audio at once and drop pending queue
      stopAllAudio();
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
  }, [enabled, active, pump, segments, stopAllAudio]);

  // Muting or changing the volume applies to the segment that is playing now.
  useEffect(() => {
    if (muted) stopAllAudio();
    if (audioRef.current) audioRef.current.volume = volume;
  }, [muted, stopAllAudio, volume]);

  useEffect(() => () => stopAllAudio(), [stopAllAudio]);

  return { ...state, muted, volume, stop: stopAllAudio };
}
