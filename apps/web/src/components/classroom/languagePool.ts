import { LANGUAGES, type LanguageCode } from "@nexclass/shared";

/**
 * The list of languages a picker should offer in a given meeting.
 *
 * The meeting's configured list always comes first; the languages the
 * participant already selected are force-included so their labels never fall
 * back silently.
 */
export function meetingLanguagePool(available: LanguageCode[], ...current: LanguageCode[]): LanguageCode[] {
  if (available.length === 0) {
    // Without a meeting payload (socket still connecting, or a failed join)
    // offer every supported language rather than quietly collapsing to English.
    return LANGUAGES.map((language) => language.code);
  }
  const pool = [...available];
  current.forEach((language) => {
    if (language && !pool.includes(language)) pool.push(language);
  });
  return pool.filter((code) => LANGUAGES.some((language) => language.code === code));
}
