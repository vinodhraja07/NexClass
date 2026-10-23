import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  Palette,
  RotateCcw,
  Sliders,
  Sparkles,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/themes/ThemeProvider";
import type { ThemeDefinition, ThemeId } from "@/themes/themes";
import { DEFAULT_THEME_ID } from "@/themes/themes";
import { ThemePreview } from "./ThemePreview";

export interface ThemeSwitcherProps {
  /** Optional custom trigger button style */
  triggerVariant?: "icon" | "button" | "pill";
  triggerLabel?: string;
  className?: string;
}

/**
 * Access Point A: Quick Theme Switcher Popover
 * Access Point B: Full Apple-inspired Appearance Settings Modal
 */
export function ThemeSwitcher({
  triggerVariant = "icon",
  triggerLabel = "Appearance",
  className,
}: ThemeSwitcherProps) {
  const reduced = useReducedMotion() ?? false;
  const { theme, themeDef, allThemes, setTheme, resetTheme } = useTheme();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  // Close popover and modal on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (modalOpen) {
          setModalOpen(false);
        } else if (popoverOpen) {
          setPopoverOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popoverOpen, modalOpen]);

  const handleSelectTheme = (id: ThemeId) => {
    setTheme(id);
  };

  return (
    <div className={clsx("relative inline-flex items-center", className)}>
      {/* Trigger Button */}
      {triggerVariant === "icon" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setPopoverOpen((prev) => !prev)}
          aria-expanded={popoverOpen}
          aria-haspopup="dialog"
          aria-label={`Current theme: ${themeDef.name}. Change color theme`}
          title={`Theme: ${themeDef.name}`}
          className={clsx(
            "nc-focus group relative inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
            popoverOpen
              ? "border-accent-400 bg-accent-400/15 text-accent-300 shadow-sm shadow-accent-400/20"
              : "border-ink-600/80 bg-ink-850/80 text-ivory-300 hover:border-ink-500 hover:bg-ink-800 hover:text-ivory-50",
          )}
        >
          <Palette className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
          <span
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-ink-900"
            style={{ backgroundColor: themeDef.colors.primary }}
            aria-hidden="true"
          />
        </button>
      ) : triggerVariant === "pill" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setPopoverOpen((prev) => !prev)}
          aria-expanded={popoverOpen}
          aria-haspopup="dialog"
          className={clsx(
            "nc-focus inline-flex h-8 items-center gap-2 rounded-full border px-3 text-2xs font-medium transition-all duration-200",
            popoverOpen
              ? "border-accent-400 bg-accent-400/15 text-accent-300 shadow-sm"
              : "border-ink-600/80 bg-ink-850/80 text-ivory-300 hover:border-ink-500 hover:text-ivory-50",
          )}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: themeDef.colors.primary }}
            aria-hidden="true"
          />
          <span className="truncate">{themeDef.name}</span>
          <Palette className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setPopoverOpen((prev) => !prev)}
          aria-expanded={popoverOpen}
          aria-haspopup="dialog"
          className="nc-focus inline-flex h-9 items-center gap-2 rounded-xl border border-ink-600 bg-ink-850 px-3 text-xs font-medium text-ivory-200 hover:border-ink-500 hover:text-ivory-50 transition-colors"
        >
          <Palette className="h-4 w-4 text-accent-300" aria-hidden="true" />
          <span>{triggerLabel}</span>
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: themeDef.colors.primary }}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Access Point A: Quick Popover Menu */}
      <AnimatePresence>
        {popoverOpen && (
          <motion.div
            ref={popoverRef}
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            role="dialog"
            aria-label="Theme Selection"
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-ink-600/90 bg-ink-900/95 p-3 shadow-2xl backdrop-blur-2xl"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between px-1.5 pb-2 mb-1.5 border-b border-ink-700/60">
              <div className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                <span className="text-2xs font-semibold uppercase tracking-wider text-ivory-300">
                  Select Theme
                </span>
              </div>
              <span className="rounded bg-accent-400/15 px-1.5 py-0.5 text-[10px] font-mono text-accent-300">
                5 Themes
              </span>
            </div>

            {/* Theme Radio Options */}
            <div role="radiogroup" aria-label="Available themes" className="space-y-1">
              {allThemes.map((item) => {
                const isSelected = item.id === theme;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectTheme(item.id)}
                    className={clsx(
                      "nc-focus group relative flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all duration-200",
                      isSelected
                        ? "bg-accent-400/12 text-ivory-50 border border-accent-400/35"
                        : "text-ivory-300 hover:bg-ink-800/80 hover:text-ivory-50 border border-transparent",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Swatch Dot Stack */}
                      <div className="flex -space-x-1 shrink-0" aria-hidden="true">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-ink-900 shadow-xs"
                          style={{ backgroundColor: item.colors.background }}
                        />
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-ink-900 shadow-xs"
                          style={{ backgroundColor: item.colors.surface }}
                        />
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-ink-900 shadow-xs"
                          style={{ backgroundColor: item.colors.primary }}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">
                          {item.name}
                          {item.id === DEFAULT_THEME_ID ? (
                            <span className="ml-1 text-[10px] text-ivory-400 opacity-70">
                              (default)
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-[10.5px] text-ivory-400/80">
                          {item.personality[0]} · {item.personality[1]}
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <motion.span
                        initial={reduced ? { opacity: 1 } : { scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-400 text-ink-950 shadow-sm"
                      >
                        <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                      </motion.span>
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-ink-600/70 opacity-0 group-hover:opacity-40 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Popover Footer: More Settings Link & Reset */}
            <div className="mt-2.5 flex items-center justify-between border-t border-ink-700/60 pt-2 px-1">
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  setModalOpen(true);
                }}
                className="nc-focus inline-flex items-center gap-1.5 text-2xs text-accent-300 hover:text-accent-200 transition-colors"
              >
                <Sliders className="h-3 w-3" aria-hidden="true" />
                <span>Appearance settings…</span>
              </button>

              {theme !== DEFAULT_THEME_ID ? (
                <button
                  type="button"
                  onClick={resetTheme}
                  title="Reset to Monsoon Aurora"
                  className="nc-focus inline-flex items-center gap-1 text-2xs text-ivory-400 hover:text-ivory-200 transition-colors"
                >
                  <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Access Point B: Full Apple-Style Appearance Settings Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="appearance-settings-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-ink-950/80 backdrop-blur-md"
              aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-ink-600/90 bg-ink-900 p-6 sm:p-8 shadow-2xl backdrop-blur-3xl max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-ink-700/70 pb-4">
                <div>
                  <span className="nc-eyebrow flex items-center gap-1.5 text-accent-300">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Apple-Inspired Design System
                  </span>
                  <h2
                    id="appearance-settings-title"
                    className="mt-1 font-display text-xl font-semibold text-ivory-50 sm:text-2xl"
                  >
                    Appearance &amp; Theme Studio
                  </h2>
                  <p className="mt-1 text-xs text-ivory-300 max-w-lg">
                    Choose from five curated, low-saturation dark color themes. All UI cards,
                    typography, borders, and animations transition harmoniously together.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close appearance settings"
                  className="nc-focus grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-ink-600 text-ivory-300 hover:border-ink-500 hover:text-ivory-50 transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Theme Grid */}
              <div
                role="radiogroup"
                aria-label="Color themes"
                className="mt-6 grid flex-1 gap-3.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 pr-1 py-1"
              >
                {allThemes.map((item) => {
                  const isSelected = item.id === theme;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelectTheme(item.id)}
                      className={clsx(
                        "nc-focus group relative flex flex-col rounded-2xl border p-4 text-left transition-all duration-300",
                        isSelected
                          ? "border-accent-400 bg-accent-400/[0.08] shadow-md shadow-accent-400/15 ring-1 ring-accent-400/40"
                          : "border-ink-600/70 bg-ink-850/60 hover:border-ink-500 hover:bg-ink-800/80",
                      )}
                    >
                      {/* Active Spring Border Indicator */}
                      {isSelected && (
                        <motion.span
                          layoutId="appearanceActiveIndicator"
                          className="absolute inset-0 rounded-2xl border-2 border-accent-400 pointer-events-none"
                          transition={
                            reduced
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 400, damping: 30 }
                          }
                        />
                      )}

                      {/* Miniature Palette Preview Card */}
                      <ThemePreview theme={item} size="md" active={isSelected} />

                      {/* Theme Info */}
                      <div className="mt-3 flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-sm font-semibold text-ivory-50 group-hover:text-accent-200 transition-colors">
                          {item.name}
                        </h3>
                        {item.id === DEFAULT_THEME_ID && (
                          <span className="rounded bg-accent-400/15 px-1.5 py-0.5 text-[9px] font-mono font-medium text-accent-300">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[11px] font-medium text-accent-300/90">
                        {item.tagline}
                      </p>

                      <p className="mt-1.5 text-2xs leading-relaxed text-ivory-300/80 flex-1">
                        {item.description}
                      </p>

                      {/* Personality Badges */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.personality.slice(0, 3).map((trait) => (
                          <span
                            key={trait}
                            className="rounded-md border border-ink-700/60 bg-ink-900/60 px-1.5 py-0.5 text-[9.5px] text-ivory-400"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>

                      {/* Selected Confirmation Check */}
                      <div className="mt-3 pt-2.5 border-t border-ink-700/50 flex items-center justify-between text-2xs">
                        <span className="text-ivory-400">
                          {isSelected ? "Active theme" : "Click to apply"}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-accent-300">
                            <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                            Selected
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-700/70 pt-4">
                <div className="flex items-center gap-2 text-2xs text-ivory-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: themeDef.colors.primary }} />
                  <span>
                    Current: <strong className="text-ivory-100">{themeDef.name}</strong> (saved to device)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetTheme}
                    className="nc-focus inline-flex h-9 items-center gap-1.5 rounded-xl border border-ink-600 bg-ink-800/80 px-3.5 text-xs font-medium text-ivory-200 hover:border-ink-500 hover:text-ivory-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Reset to Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="nc-focus inline-flex h-9 items-center rounded-xl bg-accent-400 px-4 text-xs font-semibold text-ink-950 hover:bg-accent-300 transition-colors shadow-sm shadow-accent-400/25"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
