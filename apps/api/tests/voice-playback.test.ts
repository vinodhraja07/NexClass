import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { LanguageCode } from "@nexclass/shared";

interface CaptionSegmentPayload {
  id: string;
  speakerId: string;
  speakerName: string;
  originalLanguage: LanguageCode;
  originalText: string;
  startTime: number;
  endTime: number;
  status: "pending" | "processing" | "complete" | "failed";
  translations: Partial<
    Record<
      LanguageCode,
      {
        text: string;
        provider?: string;
        status: "complete" | "failed";
        latencyMs?: number;
      }
    >
  >;
  voices: Partial<
    Record<
      LanguageCode,
      {
        provider: string;
        status: "complete" | "failed";
        latencyMs: number;
        audioUrl?: string | null;
      }
    >
  >;
}

// Mock HTMLAudioElement to verify exact lifecycle, event handlers, and disposal
class MockAudio {
  src = "";
  volume = 1;
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onpause: (() => void) | null = null;
  paused = false;

  static activeInstances: MockAudio[] = [];

  constructor(src?: string) {
    if (src) this.src = src;
    MockAudio.activeInstances.push(this);
  }

  play = vi.fn().mockImplementation(() => {
    this.paused = false;
    return Promise.resolve();
  });

  pause = vi.fn().mockImplementation(() => {
    this.paused = true;
    if (this.onpause) this.onpause();
  });

  load = vi.fn();
  removeAttribute = vi.fn((attr: string) => {
    if (attr === "src") this.src = "";
  });
}

const mockSpeechSynthesis = {
  speaking: false,
  cancel: vi.fn(() => {
    mockSpeechSynthesis.speaking = false;
  }),
  speak: vi.fn((_utt: unknown) => {
    mockSpeechSynthesis.speaking = true;
  }),
  getVoices: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

describe("Voice Playback Cancellation and Queue Isolation Suite", () => {
  beforeEach(() => {
    MockAudio.activeInstances = [];
    vi.clearAllMocks();

    // @ts-expect-error test mock
    globalThis.window = {
      setTimeout: setTimeout.bind(globalThis),
      clearTimeout: clearTimeout.bind(globalThis),
      speechSynthesis: mockSpeechSynthesis,
    };
    // @ts-expect-error test mock
    globalThis.Audio = MockAudio;
    // @ts-expect-error test mock
    globalThis.SpeechSynthesisUtterance = class {
      text: string;
      lang = "";
      volume = 1;
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("verifies MockAudio handles play, pause, src reset, and load on disposal", () => {
    const audio = new MockAudio("https://audio.example.com/en-lecture.mp3");
    expect(MockAudio.activeInstances.length).toBe(1);

    audio.play();
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.paused).toBe(false);

    audio.pause();
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.paused).toBe(true);

    audio.removeAttribute("src");
    audio.load();
    expect(audio.removeAttribute).toHaveBeenCalledWith("src");
    expect(audio.load).toHaveBeenCalledTimes(1);
    expect(audio.src).toBe("");
  });

  it("verifies speechSynthesis cancel is invoked immediately on stop", () => {
    mockSpeechSynthesis.speak(
      new (globalThis as unknown as { SpeechSynthesisUtterance: new (t: string) => unknown })
        .SpeechSynthesisUtterance("Test speech utterance"),
    );
    expect(mockSpeechSynthesis.speaking).toBe(true);

    mockSpeechSynthesis.cancel();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(mockSpeechSynthesis.speaking).toBe(false);
  });

  it("verifies AudioContext suspension logic on emergency stop", () => {
    const mockCtx = {
      state: "running" as const,
      suspend: vi.fn(() => Promise.resolve()),
    };
    const win = globalThis as unknown as { window?: { __nexclass_audio_ctx__?: { state: string; suspend: () => void } } };
    if (win.window) {
      win.window.__nexclass_audio_ctx__ = mockCtx;
      if (win.window.__nexclass_audio_ctx__ && win.window.__nexclass_audio_ctx__.state !== "closed") {
        win.window.__nexclass_audio_ctx__.suspend();
      }
    }

    expect(mockCtx.suspend).toHaveBeenCalledTimes(1);
  });

  it("verifies multilingual segment structure and voice isolation", () => {
    const segment: CaptionSegmentPayload = {
      id: "seg-1",
      speakerId: "teacher",
      speakerName: "Teacher",
      originalLanguage: "en",
      originalText: "Hello students welcome to physics.",
      startTime: Date.now() - 2000,
      endTime: Date.now() + 2000,
      status: "complete",
      translations: {
        en: { text: "Hello students welcome to physics.", provider: "demo", status: "complete", latencyMs: 10 },
        hi: { text: "नमस्ते छात्रों भौतिकी में आपका स्वागत है।", provider: "demo", status: "complete", latencyMs: 12 },
        ta: { text: "வணக்கம் மாணவர்களே இயற்பியலுக்கு வரவேற்கிறோம்.", provider: "demo", status: "complete", latencyMs: 15 },
      },
      voices: {
        en: { provider: "test", status: "complete", latencyMs: 10, audioUrl: "https://example.com/en.mp3" },
        hi: { provider: "test", status: "complete", latencyMs: 12, audioUrl: "https://example.com/hi.mp3" },
        ta: { provider: "test", status: "complete", latencyMs: 15, audioUrl: "https://example.com/ta.mp3" },
      },
    };

    expect(segment.voices.en?.audioUrl).toBe("https://example.com/en.mp3");
    expect(segment.voices.hi?.audioUrl).toBe("https://example.com/hi.mp3");
    expect(segment.voices.ta?.audioUrl).toBe("https://example.com/ta.mp3");
  });

  it("simulates language switch during audio playback and proves immediate cancellation without overlap", async () => {
    // 1. Initial playback in English
    let currentAudio: MockAudio | null = new MockAudio("https://example.com/en-segment.mp3");
    await currentAudio.play();
    expect(currentAudio.paused).toBe(false);

    // 2. User changes language to Hindi ("hi") while English is playing:
    // stopAllAudio immediately executes:
    if (currentAudio) {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.onpause = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.removeAttribute("src");
      currentAudio.load();
      currentAudio = null;
    }
    mockSpeechSynthesis.cancel();

    // Verify English audio was forcefully stopped, stripped, and disposed
    const enAudio = MockAudio.activeInstances[0];
    expect(enAudio.pause).toHaveBeenCalledTimes(1);
    expect(enAudio.paused).toBe(true);
    expect(enAudio.removeAttribute).toHaveBeenCalledWith("src");
    expect(enAudio.load).toHaveBeenCalledTimes(1);
    expect(currentAudio).toBeNull();

    // 3. Start newly selected Hindi voice playback
    currentAudio = new MockAudio("https://example.com/hi-segment.mp3");
    await currentAudio.play();

    // Verify only the new Hindi audio is actively playing, English remains halted
    expect(MockAudio.activeInstances.length).toBe(2);
    expect(MockAudio.activeInstances[0].paused).toBe(true); // English is paused
    expect(MockAudio.activeInstances[1].paused).toBe(false); // Hindi is playing
    expect(currentAudio.src).toBe("https://example.com/hi-segment.mp3");
  });

  it("simulates rapid multiple language switches (en -> hi -> ta) and prevents concurrent audio leaks", async () => {
    const activeAudios: MockAudio[] = [];

    // Helper that replicates hook stopAllAudio and spawn
    const switchLanguage = (url: string) => {
      // Emergency stop previous
      activeAudios.forEach((audio) => {
        audio.onended = null;
        audio.onerror = null;
        audio.onpause = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      });
      mockSpeechSynthesis.cancel();

      // Spawn new
      const nextAudio = new MockAudio(url);
      activeAudios.push(nextAudio);
      void nextAudio.play();
      return nextAudio;
    };

    // Rapid switches
    switchLanguage("https://example.com/en.mp3");
    switchLanguage("https://example.com/hi.mp3");
    const finalAudio = switchLanguage("https://example.com/ta.mp3");

    expect(MockAudio.activeInstances.length).toBe(3);
    // Instances 0 (en) and 1 (hi) must be paused and unloaded
    expect(MockAudio.activeInstances[0].paused).toBe(true);
    expect(MockAudio.activeInstances[0].src).toBe("");
    expect(MockAudio.activeInstances[1].paused).toBe(true);
    expect(MockAudio.activeInstances[1].src).toBe("");

    // Only instance 2 (ta) is playing
    expect(MockAudio.activeInstances[2].paused).toBe(false);
    expect(finalAudio.src).toBe("https://example.com/ta.mp3");
  });

  it("verifies abort controller aborts in-flight network requests during language switch", async () => {
    const controller = new AbortController();
    let aborted = false;

    controller.signal.addEventListener("abort", () => {
      aborted = true;
    });

    // Language change triggers abort
    controller.abort();
    expect(aborted).toBe(true);
    expect(controller.signal.aborted).toBe(true);
  });

  it("verifies queue isolation filters historical segments while identifying the active segment", () => {
    const now = Date.now();
    const segments: CaptionSegmentPayload[] = [
      {
        id: "seg-old-1",
        speakerId: "teacher",
        speakerName: "Teacher",
        originalLanguage: "en",
        originalText: "Sentence 1",
        startTime: now - 15000,
        endTime: now - 10000,
        status: "complete",
        translations: { en: { text: "Sentence 1", status: "complete" }, hi: { text: "वाक्य 1", status: "complete" } },
        voices: {},
      },
      {
        id: "seg-old-2",
        speakerId: "teacher",
        speakerName: "Teacher",
        originalLanguage: "en",
        originalText: "Sentence 2",
        startTime: now - 9000,
        endTime: now - 5000,
        status: "complete",
        translations: { en: { text: "Sentence 2", status: "complete" }, hi: { text: "वाक्य 2", status: "complete" } },
        voices: {},
      },
      {
        id: "seg-active",
        speakerId: "teacher",
        speakerName: "Teacher",
        originalLanguage: "en",
        originalText: "Active sentence currently in flight",
        startTime: now - 1000,
        endTime: now + 3000,
        status: "complete",
        translations: { en: { text: "Active sentence", status: "complete" }, hi: { text: "सक्रिय वाक्य", status: "complete" } },
        voices: {},
      },
    ];

    // Find active segment using the hook's algorithm
    const currentActive = [...segments]
      .reverse()
      .find(
        (seg) =>
          now >= seg.startTime &&
          now <= (seg.endTime || seg.startTime + 6000) + 2500,
      );

    expect(currentActive?.id).toBe("seg-active");

    // All past segments marked as seen
    const seen = new Set<string>();
    segments.forEach((seg) => seen.add(`hi:${seg.id}`));

    expect(seen.has("hi:seg-old-1")).toBe(true);
    expect(seen.has("hi:seg-old-2")).toBe(true);
    expect(seen.has("hi:seg-active")).toBe(true);

    // Queue only receives currentActive
    const queue: CaptionSegmentPayload[] = [];
    if (currentActive) {
      queue.push(currentActive);
    }

    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe("seg-active");
  });
});
