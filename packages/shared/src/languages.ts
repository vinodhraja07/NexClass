export type LanguageCode = "en" | "ta" | "hi" | "bn" | "mr" | "or";

export interface LanguageDefinition {
  code: LanguageCode;
  name: string;
  nativeName: string;
  script: string;
  direction: "ltr" | "rtl";
  /** BCP-47 tags used for Web Speech API recognition */
  asrTags: string[];
  /** BCP-47 tags used for SpeechSynthesis voices */
  ttsTags: string[];
  /** Indic languages supported by the AI4Bharat / IndicTrans2 family of models */
  indicTrans2: boolean;
  accent: string;
}

export const LANGUAGES: LanguageDefinition[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "Latin",
    direction: "ltr",
    asrTags: ["en-IN", "en-US", "en-GB"],
    ttsTags: ["en-IN", "en-US"],
    indicTrans2: false,
    accent: "#5EEAD4",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil",
    direction: "ltr",
    asrTags: ["ta-IN", "ta-LK"],
    ttsTags: ["ta-IN"],
    indicTrans2: true,
    accent: "#F0A868",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
    direction: "ltr",
    asrTags: ["hi-IN"],
    ttsTags: ["hi-IN"],
    indicTrans2: true,
    accent: "#F2C14E",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali",
    direction: "ltr",
    asrTags: ["bn-IN", "bn-BD"],
    ttsTags: ["bn-IN"],
    indicTrans2: true,
    accent: "#7DD3A8",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "Devanagari",
    direction: "ltr",
    asrTags: ["mr-IN"],
    ttsTags: ["mr-IN"],
    indicTrans2: true,
    accent: "#9BC7E3",
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    script: "Oriya",
    direction: "ltr",
    asrTags: ["or-IN", "od-IN", "ory-IN"],
    ttsTags: ["or-IN", "od-IN", "ory-IN"],
    indicTrans2: true,
    accent: "#E58AA8",
  },
];

export const LANGUAGE_MAP: Record<LanguageCode, LanguageDefinition> = LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.code] = lang;
    return acc;
  },
  {} as Record<LanguageCode, LanguageDefinition>,
);

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(LANGUAGE_MAP, value);
}

export function languageName(code: string): string {
  return LANGUAGE_MAP[code as LanguageCode]?.name ?? code;
}

export function languageNativeName(code: string): string {
  return LANGUAGE_MAP[code as LanguageCode]?.nativeName ?? code;
}

export function defaultAsrTag(code: string): string {
  return LANGUAGE_MAP[code as LanguageCode]?.asrTags[0] ?? "en-IN";
}

export function defaultTtsTag(code: string): string {
  return LANGUAGE_MAP[code as LanguageCode]?.ttsTags[0] ?? "en-IN";
}

/** Only the Indic languages (everything except English) are typically offered as caption targets. */
export const TRANSLATION_TARGETS: LanguageCode[] = LANGUAGES.filter((l) => l.indicTrans2).map(
  (l) => l.code,
);
