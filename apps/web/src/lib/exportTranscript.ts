import {
  languageName,
  type LanguageCode,
  type MeetingPublic,
  type TranscriptSegmentPublic,
  type TranslationPublic,
} from "@nexclass/shared";
import { api } from "./api";

export interface CompileTranscriptOptions {
  meeting: MeetingPublic;
  segments: TranscriptSegmentPublic[];
  translations: TranslationPublic[];
  participantCount?: number;
}

export function formatTranscriptTimestamp(time: number): string {
  // Handle relative seconds vs epoch milliseconds
  const totalSecs = Math.max(
    0,
    Math.floor(time > 100000 ? (time % 86400000) / 1000 : time),
  );
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) {
    return `[${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}]`;
  }
  return `[${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}]`;
}

export function compileTranscriptDocument({
  meeting,
  segments,
  translations,
  participantCount = 1,
}: CompileTranscriptOptions): string {
  const dateStr = meeting.createdAt
    ? new Date(meeting.createdAt).toUTCString()
    : new Date().toUTCString();
  const lectureLang = `${languageName(meeting.speakerLanguage)} (${meeting.speakerLanguage.toUpperCase()})`;
  const availableLangs = (meeting.availableLanguages || ["en", "ta", "hi", "bn", "mr", "or"])
    .map((c) => `${languageName(c)} (${c.toUpperCase()})`)
    .join(", ");

  const lines: string[] = [
    "================================================================================",
    "NEXCLASS SESSION TRANSCRIPT ARCHIVE",
    `Room Code:        ${meeting.code}`,
    `Classroom Title:  ${meeting.title}`,
    `Date & Time:      ${dateStr}`,
    `Lecture Language: ${lectureLang}`,
    `Supported Langs:  ${availableLangs}`,
    `Participant Count: ${participantCount}`,
    "================================================================================",
    "",
  ];

  if (!segments || segments.length === 0) {
    lines.push("[No speech transcription segments were recorded during this session.]");
    lines.push("");
    lines.push("Synchronized multi-language recordings are automatically stored in NexClass cloud.");
    return lines.join("\n");
  }

  // Group translations by segmentId for fast lookup
  const transBySegment = new Map<string, TranslationPublic[]>();
  for (const t of translations || []) {
    const list = transBySegment.get(t.segmentId) || [];
    list.push(t);
    transBySegment.set(t.segmentId, list);
  }

  // Sort segments chronologically
  const sortedSegments = [...segments].sort((a, b) => {
    const timeA = a.startTime ?? 0;
    const timeB = b.startTime ?? 0;
    return timeA - timeB;
  });

  lines.push("--- SYNCHRONIZED CHRONOLOGICAL TRANSCRIPT LOG ---");
  lines.push("");

  for (const seg of sortedSegments) {
    const timestamp = formatTranscriptTimestamp(seg.startTime ?? 0);
    const speaker = seg.speakerName || "Speaker";
    const origLang = seg.originalLanguage?.toUpperCase() || meeting.speakerLanguage.toUpperCase();

    lines.push(`${timestamp} ${speaker} (${origLang}):`);
    lines.push(`  "${seg.originalText}"`);

    const segTranslations = transBySegment.get(seg.id) || [];
    // Sort translations by language code
    segTranslations.sort((a, b) => a.language.localeCompare(b.language));

    for (const trans of segTranslations) {
      if (trans.language === seg.originalLanguage) continue; // Skip identical original
      const langUpper = trans.language.toUpperCase();
      const langFull = languageName(trans.language);
      lines.push(`    [${langUpper} - ${langFull}]: "${trans.text}"`);
    }

    lines.push("");
  }

  lines.push("================================================================================");
  lines.push("End of NexClass Multilingual Transcript Archive");
  lines.push("================================================================================");

  return lines.join("\n");
}

export async function exportTranscript(
  meeting: MeetingPublic,
  options?: { participantCount?: number },
): Promise<{ success: boolean; filename: string; text: string }> {
  let segments: TranscriptSegmentPublic[] = [];
  let translations: TranslationPublic[] = [];

  try {
    const transcriptRes = await api.transcripts(meeting.code);
    segments = transcriptRes.segments || [];
  } catch (error) {
    console.warn(`Could not fetch transcripts for meeting ${meeting.code}:`, error);
  }

  try {
    const translationRes = await api.translations(meeting.code);
    translations = translationRes.translations || [];
  } catch (error) {
    console.warn(`Could not fetch translations for meeting ${meeting.code}:`, error);
  }

  const docText = compileTranscriptDocument({
    meeting,
    segments,
    translations,
    participantCount: options?.participantCount ?? 1,
  });

  const dateSlug = meeting.createdAt
    ? new Date(meeting.createdAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const filename = `nexclass-transcript-${meeting.code.toLowerCase()}-${dateSlug}.txt`;

  // Trigger browser file download if running in client DOM
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const blob = new Blob([docText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Browser download failed:", e);
    }
  }

  return {
    success: true,
    filename,
    text: docText,
  };
}
