import { useCallback, useEffect, useMemo, useState } from "react";
import type { VoiceMode } from "./useVoicePlayback";

export type CaptionScale = "sm" | "md" | "lg";
export type CaptionMode = "translated" | "original";

export interface ClassroomPreferences {
  captionsVisible: boolean;
  captionScale: CaptionScale;
  captionMode: CaptionMode;
  highContrast: boolean;
  voiceMode: VoiceMode;
  voiceMuted: boolean;
  voiceVolume: number;
}

const STORAGE_KEY = "nexclass.classroom.preferences";

const DEFAULTS: ClassroomPreferences = {
  captionsVisible: true,
  captionScale: "md",
  captionMode: "translated",
  highContrast: false,
  voiceMode: "original-captions",
  voiceMuted: false,
  voiceVolume: 0.9,
};

const SCALE_ORDER: CaptionScale[] = ["sm", "md", "lg"];

function readStored(): ClassroomPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ClassroomPreferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Local, per-device classroom preferences. They are stored in the browser and
 * never sent to the server - changing them affects only this participant.
 */
export function useClassroomPreferences() {
  const [preferences, setPreferences] = useState<ClassroomPreferences>(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* storage is optional */
    }
  }, [preferences]);

  const patch = useCallback((next: Partial<ClassroomPreferences>) => {
    setPreferences((current) => ({ ...current, ...next }));
  }, []);

  const stepCaptionScale = useCallback((direction: 1 | -1) => {
    setPreferences((current) => {
      const index = SCALE_ORDER.indexOf(current.captionScale);
      const nextIndex = Math.min(SCALE_ORDER.length - 1, Math.max(0, index + direction));
      if (nextIndex === index) return current;
      return { ...current, captionScale: SCALE_ORDER[nextIndex] };
    });
  }, []);

  return useMemo(
    () => ({
      preferences,
      setCaptionsVisible: (visible: boolean) => patch({ captionsVisible: visible }),
      toggleCaptionsVisible: () => patch({ captionsVisible: !preferences.captionsVisible }),
      setCaptionScale: (scale: CaptionScale) => patch({ captionScale: scale }),
      stepCaptionScale,
      setCaptionMode: (mode: CaptionMode) => patch({ captionMode: mode }),
      setHighContrast: (enabled: boolean) => patch({ highContrast: enabled }),
      setVoiceMode: (mode: VoiceMode) => patch({ voiceMode: mode }),
      setVoiceMuted: (muted: boolean) => patch({ voiceMuted: muted }),
      setVoiceVolume: (volume: number) => patch({ voiceVolume: volume }),
      reset: () => setPreferences(DEFAULTS),
    }),
    [patch, preferences, stepCaptionScale],
  );
}
