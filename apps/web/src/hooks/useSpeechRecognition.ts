import { useCallback, useEffect, useRef, useState } from "react";
import { defaultAsrTag, type LanguageCode } from "@nexclass/shared";

interface SpeechAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechAlternativeLike;
}

interface SpeechEventLike {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechResultLike;
  };
}

interface SpeechErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export interface SpeechRecognitionController {
  /** True when the browser exposes the Web Speech API. */
  supported: boolean;
  listening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export interface UseSpeechRecognitionOptions {
  /** The language the speaker is talking in. */
  language: LanguageCode;
  /** Recognition only runs while this is true. */
  enabled: boolean;
  onInterim: (text: string) => void;
  onFinal: (text: string, startTime: number, endTime: number) => void;
  onError?: (message: string) => void;
}

/**
 * Live captions straight from the browser's own speech recognition.
 *
 * The recogniser is the *teacher's* microphone. Nothing is fabricated: when
 * the browser does not support the Web Speech API the hook reports it and the
 * classroom offers a manual caption input instead.
 */
export function useSpeechRecognition({
  language,
  enabled,
  onInterim,
  onFinal,
  onError,
}: UseSpeechRecognitionOptions): SpeechRecognitionController {
  const ctor = getRecognitionCtor();
  const supported = ctor !== null;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(enabled);
  const interimRef = useRef(onInterim);
  const finalRef = useRef(onFinal);
  const errorRef = useRef(onError);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    interimRef.current = onInterim;
    finalRef.current = onFinal;
    errorRef.current = onError;
  }, [onError, onFinal, onInterim]);

  const stop = useCallback(() => {
    wantRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      try {
        recognition.onend = null;
        recognition.stop();
      } catch {
        /* already stopped */
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!ctor) {
      setError("This browser does not support in-browser speech recognition.");
      return;
    }
    if (recognitionRef.current) return;

    let recognition: SpeechRecognitionLike;
    try {
      recognition = new ctor();
    } catch {
      setError("The browser refused to start speech recognition.");
      return;
    }

    recognition.lang = defaultAsrTag(language);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    startedAtRef.current = Date.now();

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result[0];
        if (!alternative) continue;
        if (result.isFinal) {
          const text = alternative.transcript.trim();
          if (text) {
            const endTime = Date.now();
            finalRef.current(text, startedAtRef.current, endTime);
            startedAtRef.current = endTime;
          }
        } else {
          interim += alternative.transcript;
        }
      }
      if (interim.trim()) interimRef.current(interim.trim());
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      const message =
        event.error === "not-allowed"
          ? "Microphone access was blocked, so in-browser recognition cannot run."
          : event.error === "network"
            ? "The browser speech service could not be reached."
            : `Speech recognition stopped: ${event.error}.`;
      setError(message);
      errorRef.current?.(message);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (wantRef.current) {
        // Chrome ends the session after a short silence - restart it.
        window.setTimeout(() => {
          if (wantRef.current) start();
        }, 250);
      }
    };

    recognitionRef.current = recognition;
    wantRef.current = true;
    try {
      recognition.start();
      setListening(true);
      setError(null);
    } catch {
      recognitionRef.current = null;
      setError("The browser refused to start speech recognition.");
    }
  }, [ctor, language]);

  const toggle = useCallback(() => {
    if (recognitionRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => {
    wantRef.current = enabled;
    if (!enabled) {
      stop();
    }
  }, [enabled, stop]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, error, start, stop, toggle };
}
