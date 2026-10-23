import type { LanguageCode, SegmentStatus } from "@nexclass/shared";
import { protectTerms, restoreTerms } from "@nexclass/terminology";
import {
  TranslationSegmentModel,
  TranscriptSegmentModel,
  VoiceSegmentModel,
  type MeetingDoc,
  type TranscriptSegmentDoc,
} from "../models/index";
import { getTranslationAdapter, getTtsAdapter, translationProviderInfo, ttsProviderInfo } from "./providers";

export interface ProcessedSegment {
  segment: TranscriptSegmentDoc;
  translations: {
    language: LanguageCode;
    text: string;
    provider: string;
    status: SegmentStatus;
    latencyMs: number;
    error?: string;
  }[];
  voices: {
    language: LanguageCode;
    provider: string;
    status: SegmentStatus;
    latencyMs: number;
    audioUrl: string | null;
    error?: string;
  }[];
  protectedTerms: { termId: string; surface: string }[];
}

export interface ProcessSegmentOptions {
  meeting: MeetingDoc;
  segment: TranscriptSegmentDoc;
  captionLanguages: LanguageCode[];
  voiceLanguages: LanguageCode[];
}

/**
 * The multilingual caption pipeline.
 *
 *   original transcript
 *     -> technical terminology protection
 *     -> translation per target language
 *     -> translated voice per target language
 *
 * The original transcript is never overwritten. Translations and voice
 * segments always keep a reference back to the original segment id.
 */
export async function processSegment(options: ProcessSegmentOptions): Promise<ProcessedSegment> {
  const { meeting, segment, captionLanguages, voiceLanguages } = options;
  const protectedText = protectTerms(segment.originalText);
  const protectedTerms = protectedText.terms.map((t) => ({ termId: t.termId, surface: t.surface }));

  await TranscriptSegmentModel.updateMany(
    { _id: segment.id } as Record<string, unknown>,
    {
      $set: {
        status: "processing",
        protectedTerms,
      },
    },
  );

  const translationAdapter = getTranslationAdapter();
  const translationInfo = translationProviderInfo();
  const translations: ProcessedSegment["translations"] = [];
  const voices: ProcessedSegment["voices"] = [];

  const uniqueCaptionLanguages = [...new Set(captionLanguages)];
  const uniqueVoiceLanguages = [...new Set(voiceLanguages)];

  for (const language of uniqueCaptionLanguages) {
    if (language === segment.originalLanguage) {
      translations.push({
        language,
        text: segment.originalText,
        provider: "original",
        status: "complete",
        latencyMs: 0,
      });
      await TranslationSegmentModel.create({
        meetingId: meeting.id!,
        segmentId: segment.id!,
        language,
        text: segment.originalText,
        provider: "original",
        status: "complete",
        latencyMs: 0,
        isFallback: false,
      });
      continue;
    }

    if (!translationAdapter) {
      translations.push({
        language,
        text: "",
        provider: translationInfo.provider,
        status: "failed",
        latencyMs: 0,
        error: "No translation provider is configured on the server.",
      });
      await TranslationSegmentModel.create({
        meetingId: meeting.id!,
        segmentId: segment.id!,
        language,
        text: "",
        provider: translationInfo.provider,
        status: "failed",
        latencyMs: 0,
        isFallback: false,
      });
      continue;
    }

    try {
      const result = await translationAdapter.translate({
        text: protectedText.text,
        source: segment.originalLanguage,
        target: language,
      });
      const restored = restoreTerms(result.text, protectedText.terms, language);
      translations.push({
        language,
        text: restored.text,
        provider: result.provider,
        status: "complete",
        latencyMs: result.latencyMs,
      });
      await TranslationSegmentModel.create({
        meetingId: meeting.id!,
        segmentId: segment.id!,
        language,
        text: restored.text,
        provider: result.provider,
        status: "complete",
        latencyMs: result.latencyMs,
        isFallback: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Translation failed.";
      translations.push({
        language,
        text: "",
        provider: translationAdapter.name,
        status: "failed",
        latencyMs: 0,
        error: message,
      });
      await TranslationSegmentModel.create({
        meetingId: meeting.id!,
        segmentId: segment.id!,
        language,
        text: "",
        provider: translationAdapter.name,
        status: "failed",
        latencyMs: 0,
        isFallback: false,
      });
    }
  }

  const ttsAdapter = getTtsAdapter();
  const ttsInfo = ttsProviderInfo();

  await Promise.all(
    uniqueVoiceLanguages.map(async (language) => {
      const translation = translations.find((item) => item.language === language);
      if (!translation || translation.status !== "complete") {
        voices.push({
          language,
          provider: ttsInfo.provider,
          status: "failed",
          latencyMs: 0,
          audioUrl: null,
          error: translation?.error ?? "No translated text available for this language.",
        });
        await VoiceSegmentModel.create({
          meetingId: meeting.id!,
          segmentId: segment.id!,
          language,
          provider: ttsInfo.provider,
          status: "failed",
          latencyMs: 0,
          audioUrl: null,
          durationMs: null,
        });
        return;
      }

      if (!ttsAdapter) {
        // The browser will speak the translated text locally with
        // SpeechSynthesis. The UI labels this clearly as a local fallback.
        voices.push({
          language,
          provider: "browser-speech-synthesis",
          status: "complete",
          latencyMs: 0,
          audioUrl: null,
        });
        await VoiceSegmentModel.create({
          meetingId: meeting.id!,
          segmentId: segment.id!,
          language,
          provider: "browser-speech-synthesis",
          status: "complete",
          latencyMs: 0,
          audioUrl: null,
          durationMs: null,
        });
        return;
      }

      try {
        const result = await ttsAdapter.synthesize({ text: translation.text, language });
        voices.push({
          language,
          provider: result.provider,
          status: "complete",
          latencyMs: result.latencyMs,
          audioUrl: result.audioUrl,
        });
        await VoiceSegmentModel.create({
          meetingId: meeting.id!,
          segmentId: segment.id!,
          language,
          provider: result.provider,
          status: "complete",
          latencyMs: result.latencyMs,
          audioUrl: result.audioUrl,
          durationMs: result.durationMs ?? null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Speech synthesis failed.";
        voices.push({
          language,
          provider: ttsAdapter.name,
          status: "failed",
          latencyMs: 0,
          audioUrl: null,
          error: message,
        });
        await VoiceSegmentModel.create({
          meetingId: meeting.id!,
          segmentId: segment.id!,
          language,
          provider: ttsAdapter.name,
          status: "failed",
          latencyMs: 0,
          audioUrl: null,
          durationMs: null,
        });
      }
    }),
  );

  await TranscriptSegmentModel.updateMany(
    { _id: segment.id } as Record<string, unknown>,
    { $set: { status: "complete" } },
  );

  return { segment, translations, voices, protectedTerms };
}
