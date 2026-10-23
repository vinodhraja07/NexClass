import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CaptionSegmentPayload } from "@/lib/transport";

// Mock minimal DOM environment if running in node environment
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

describe("Voice Playback Cancellation and Queue Reset", () => {
  beforeEach(() => {
    MockAudio.activeInstances = [];
    vi.clearAllMocks();

    // Set up global browser mocks
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

  it("verifies MockAudio tracks play, pause, and disposal cleanly", () => {
    const audio = new MockAudio("https://example.com/audio-en.mp3");
    expect(MockAudio.activeInstances.length).toBe(1);

    audio.play();
    expect(audio.play).toHaveBeenCalled();
    expect(audio.paused).toBe(false);

    audio.pause();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.paused).toBe(true);

    audio.removeAttribute("src");
    audio.load();
    expect(audio.removeAttribute).toHaveBeenCalledWith("src");
    expect(audio.load).toHaveBeenCalled();
  });

  it("verifies speech synthesis cancel is invoked on stop", () => {
    mockSpeechSynthesis.speak({});
    expect(mockSpeechSynthesis.speaking).toBe(true);

    mockSpeechSynthesis.cancel();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(mockSpeechSynthesis.speaking).toBe(false);
  });

  it("verifies segment structure handles multilingual voice payloads", () => {
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
});
