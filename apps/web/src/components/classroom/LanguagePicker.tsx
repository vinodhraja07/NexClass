import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import clsx from "clsx";
import { LANGUAGES, languageName, type LanguageCode } from "@nexclass/shared";

export interface LanguagePickerProps {
  id: string;
  label: string;
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  languages?: LanguageCode[];
  /** Small hint under the control - used for the "your choice only" note. */
  note?: string;
  align?: "left" | "right";
  disabled?: boolean;
  className?: string;
}

/**
 * A single language selector.
 *
 * Caption language and voice language are two independent pickers - changing
 * one never touches the other and never touches anybody else in the room.
 */
export function LanguagePicker({
  id,
  label,
  value,
  onChange,
  languages,
  note,
  align = "left",
  disabled = false,
  className,
}: LanguagePickerProps) {
  const reduced = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  // Lives in a portal (outside rootRef), so outside-click checks need it.
  const menuRef = useRef<HTMLUListElement | null>(null);

  const available = (languages && languages.length ? languages : LANGUAGES.map((l) => l.code))
    .map((code) => LANGUAGES.find((language) => language.code === code))
    .filter((language): language is (typeof LANGUAGES)[number] => Boolean(language));

  const current = LANGUAGES.find((language) => language.code === value) ?? LANGUAGES[0];

  const computeCoords = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const flip = spaceBelow < 140;
    return {
      top: flip ? Math.max(8, rect.top - 296) : rect.bottom + 6,
      left: align === "right" ? rect.right - Math.max(rect.width, 220) : rect.left,
      width: Math.max(rect.width, 220),
      maxHeight: flip ? Math.min(288, rect.top - 20) : Math.min(288, spaceBelow),
    };
  }, [align]);

  const openMenu = () => {
    setMenuCoords(computeCoords());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (
        !rootRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // The menu lives in a portal, so re-anchor it whenever any ancestor
    // scrolls or the window resizes.
    const reposition = () => {
      const coords = computeCoords();
      if (coords) setMenuCoords(coords);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, computeCoords]);

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <span id={`${id}-label`} className="nc-eyebrow mb-1.5 block">
        {label}
      </span>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={clsx(
          "nc-focus flex h-10 w-full items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 text-left text-xs text-text-primary transition-all",
          "hover:border-primary/50 hover:bg-background disabled:opacity-50 shadow-xs",
        )}
      >
        <Globe2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          <span lang={current.code} className="font-semibold text-text-primary">
            {current.nativeName}
          </span>
          <span className="ml-1.5 text-2xs text-text-secondary">({current.name})</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
          className="text-text-secondary"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </motion.span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && menuCoords ? (
            <motion.ul
              ref={menuRef}
              role="listbox"
              aria-labelledby={`${id}-label`}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.16, ease: [0.2, 0.8, 0.2, 1] }}
              className="nc-focus fixed z-50 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-xl backdrop-blur-xl"
              style={{
                top: menuCoords.top,
                left: menuCoords.left,
                width: menuCoords.width,
                maxHeight: menuCoords.maxHeight,
              }}
            >
              {available.map((language) => {
                const selected = language.code === value;
                return (
                  <li key={language.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(language.code);
                        setOpen(false);
                      }}
                      className={clsx(
                        "nc-focus flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        selected
                          ? "bg-primary/15 text-text-primary font-semibold"
                          : "text-text-secondary hover:bg-muted hover:text-text-primary",
                      )}
                    >
                      <span className="flex-1">
                        <span lang={language.code} className="block text-[13px] font-medium text-text-primary">
                          {language.nativeName}
                        </span>
                        <span className="block text-2xs text-text-secondary">{language.name}</span>
                      </span>
                      {selected ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}

      {note ? <p className="mt-1 text-2xs text-text-secondary">{note}</p> : null}
      <span className="sr-only">Currently {languageName(value)}</span>
    </div>
  );
}
