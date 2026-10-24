import { useId } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import { LANGUAGES, type LanguageCode } from "@nexclass/shared";

const LANGUAGE_BY_CODE = new Map(LANGUAGES.map((language) => [language.code, language]));

export const ALL_LANGUAGE_CODES: LanguageCode[] = LANGUAGES.map((language) => language.code);

export interface LanguageChipsProps {
  mode: "single" | "multiple";
  value: LanguageCode[];
  onChange: (next: LanguageCode[]) => void;
  codes?: LanguageCode[];
  label?: string;
  description?: string;
  /** Chips that must stay selected (for example the speaker language). */
  requiredCodes?: LanguageCode[];
  className?: string;
}

/**
 * Keyboard operable language chips. Rendered as real buttons so tab order and
 * activation work without any custom key handling.
 */
export function LanguageChips({
  mode,
  value,
  onChange,
  codes = ALL_LANGUAGE_CODES,
  label,
  description,
  requiredCodes = [],
  className,
}: LanguageChipsProps) {
  const layoutId = useId();

  function toggle(code: LanguageCode) {
    if (mode === "single") {
      onChange([code]);
      return;
    }
    if (value.includes(code)) {
      if (requiredCodes.includes(code)) return;
      onChange(value.filter((entry) => entry !== code));
      return;
    }
    onChange([...value, code]);
  }

  return (
    <div className={clsx("space-y-2", className)}>
      {description ? <p className="text-2xs text-ivory-400">{description}</p> : null}
      <div
        role={mode === "single" ? "radiogroup" : "group"}
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {codes.map((code) => {
          const language = LANGUAGE_BY_CODE.get(code);
          if (!language) return null;
          const active = value.includes(code);
          const locked = requiredCodes.includes(code) && active;
          return (
            <button
              key={code}
              type="button"
              role={mode === "single" ? "radio" : undefined}
              aria-checked={mode === "single" ? active : undefined}
              aria-pressed={mode === "multiple" ? active : undefined}
              title={locked ? `${language.name} (always included)` : language.name}
              onClick={() => toggle(code)}
              className={clsx(
                "nc-focus relative inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors duration-200",
                active
                  ? "border-accent-400/50 text-ivory-50"
                  : "border-ink-600 bg-ink-900/50 text-ivory-300 hover:border-ink-500 hover:text-ivory-100",
              )}
            >
              {active ? (
                <motion.span
                  layoutId={`chip-${layoutId}`}
                  className="absolute inset-0 rounded-full bg-accent-400/12 ring-1 ring-accent-400/40"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative text-[13px] font-medium font-indic leading-relaxed">
                {language.nativeName}
              </span>
              <span className="relative text-[10px] font-semibold uppercase tracking-[0.12em] text-ivory-400">
                {language.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
