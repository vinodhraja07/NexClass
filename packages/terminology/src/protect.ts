import type { LanguageCode } from "@nexclass/shared";
import {
  GLOSSARY,
  type GlossarySubject,
  type GlossaryTerm,
  localizedEquivalent,
} from "./glossary";

const PUA_START = "\uE000";
const PUA_END = "\uE001";

export interface ProtectedTerm {
  termId: string;
  canonical: string;
  /** The exact surface form found in the source text (keeps the original casing). */
  surface: string;
  offset: number;
  length: number;
  placeholder: string;
}

export interface ProtectedText {
  /** Text with terms replaced by opaque placeholders safe to send to a translator. */
  text: string;
  terms: ProtectedTerm[];
}

export interface DetectionResult {
  term: GlossaryTerm;
  surface: string;
  offset: number;
  length: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatcher(term: GlossaryTerm): RegExp {
  const surfaces = [term.term, ...(term.aliases ?? [])].filter(Boolean);
  const alternatives = surfaces.map(escapeRegExp).sort((a, b) => b.length - a.length).join("|");
  return new RegExp(`(${alternatives})`, "gi");
}

const MATCHERS = GLOSSARY.map((term) => ({ term, matcher: buildMatcher(term) }));

/**
 * Detects glossary terms inside an English source string. Matching is
 * case-insensitive but the original surface casing is preserved.
 */
export function detectTerms(
  text: string,
  subjects?: GlossarySubject[],
): DetectionResult[] {
  if (!text) return [];
  const allowed = subjects?.length
    ? new Set(subjects)
    : undefined;
  const found: DetectionResult[] = [];
  for (const { term, matcher } of MATCHERS) {
    if (allowed && !term.subjects.some((s) => allowed.has(s))) continue;
    matcher.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(text)) !== null) {
      found.push({
        term,
        surface: match[0],
        offset: match.index,
        length: match[0].length,
      });
      if (match[0].length === 0) matcher.lastIndex += 1;
    }
  }
  // Remove overlaps, preferring the longest match.
  found.sort((a, b) => a.offset - b.offset || b.length - a.length);
  const nonOverlapping: DetectionResult[] = [];
  let cursor = -1;
  for (const item of found) {
    if (item.offset >= cursor) {
      nonOverlapping.push(item);
      cursor = item.offset + item.length;
    }
  }
  return nonOverlapping;
}

/**
 * Replaces protected technical terms with opaque placeholders before the text
 * is handed to a translation provider. Placeholders use Unicode private-use
 * characters so that a well behaved MT engine carries them through untouched.
 */
export function protectTerms(
  text: string,
  options: { subjects?: GlossarySubject[]; startIndex?: number } = {},
): ProtectedText {
  if (!text) return { text: "", terms: [] };
  const detections = detectTerms(text, options.subjects);
  const startIndex = options.startIndex ?? 0;
  const terms: ProtectedTerm[] = [];
  let out = "";
  let cursor = 0;
  detections.forEach((detection, index) => {
    out += text.slice(cursor, detection.offset);
    const placeholder = `${PUA_START}${startIndex + index}${PUA_END}`;
    out += placeholder;
    terms.push({
      termId: detection.term.id,
      canonical: detection.term.term,
      surface: detection.surface,
      offset: detection.offset,
      length: detection.length,
      placeholder,
    });
    cursor = detection.offset + detection.length;
  });
  out += text.slice(cursor);
  return { text: out, terms };
}

/**
 * Restores protected terms in a translated string. When a local equivalent is
 * available it is used, and the original English term is appended whenever the
 * glossary entry is marked `preserveOriginal` so the source wording is never
 * lost.
 */
export function restoreTerms(
  translatedText: string,
  terms: ProtectedTerm[],
  targetLanguage: LanguageCode,
): { text: string; restored: string[]; missing: string[] } {
  if (!translatedText) return { text: translatedText, restored: [], missing: [] };
  const restored: string[] = [];
  const missing: string[] = [];
  let out = translatedText;

  for (const entry of terms) {
    const glossaryTerm = GLOSSARY.find((t) => t.id === entry.termId);
    if (!glossaryTerm) continue;
    const equivalent = localizedEquivalent(glossaryTerm, targetLanguage);
    const replacement = buildReplacement(glossaryTerm, entry, equivalent, targetLanguage);
    const placeholderRe = new RegExp(escapeRegExp(entry.placeholder), "g");
    if (placeholderRe.test(out)) {
      out = out.replace(placeholderRe, replacement);
      restored.push(entry.surface);
    } else {
      // The translation engine dropped the placeholder. Keep the original term
      // visible instead of silently losing technical vocabulary.
      if (!out.toLowerCase().includes(entry.canonical.toLowerCase())) {
        out = `${out} (${entry.canonical})`;
        missing.push(entry.surface);
      } else {
        restored.push(entry.surface);
      }
    }
  }
  return { text: out.trim(), restored, missing };
}

function buildReplacement(
  term: GlossaryTerm,
  entry: ProtectedTerm,
  equivalent: { text: string; verified: boolean } | null,
  targetLanguage: LanguageCode,
): string {
  const original = entry.surface;
  if (!equivalent) return original;
  if (targetLanguage === "en") return original;
  if (term.preserveOriginal) {
    return `${equivalent.text} (${original})`;
  }
  return equivalent.text;
}

/**
 * Human readable rendering of a term for the UI (used by the terminology
 * inspector inside the classroom).
 */
export function describeTerm(
  termId: string,
  language: LanguageCode,
): { canonical: string; localized: string | null; verified: boolean; definition: string; reviewStatus: string } {
  const term = GLOSSARY.find((t) => t.id === termId);
  if (!term) {
    return {
      canonical: termId,
      localized: null,
      verified: false,
      definition: "",
      reviewStatus: "unknown",
    };
  }
  const equivalent = localizedEquivalent(term, language);
  return {
    canonical: term.term,
    localized: equivalent?.text ?? null,
    verified: equivalent?.verified ?? false,
    definition: term.definition,
    reviewStatus: term.reviewStatus,
  };
}

export function glossaryStats() {
  return {
    total: GLOSSARY.length,
    approved: GLOSSARY.filter((t) => t.reviewStatus === "approved").length,
    needsReview: GLOSSARY.filter((t) => t.reviewStatus === "needs-review").length,
    draft: GLOSSARY.filter((t) => t.reviewStatus === "draft").length,
  };
}
