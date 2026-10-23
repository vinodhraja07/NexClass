import React from "react";
import clsx from "clsx";
import type { ThemeDefinition } from "@/themes/themes";

export interface ThemePreviewProps {
  theme: ThemeDefinition;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  className?: string;
}

/**
 * Renders real color swatches and miniature UI mockup for a given NexClass theme.
 * Inspired by Apple's System Appearance palette preview cards.
 */
export function ThemePreview({
  theme,
  size = "md",
  active = false,
  className,
}: ThemePreviewProps) {
  const { colors } = theme;

  if (size === "sm") {
    return (
      <div
        className={clsx(
          "flex items-center gap-1 rounded-lg p-1 transition-all",
          className,
        )}
        title={`${theme.name} palette`}
        aria-hidden="true"
      >
        <span
          className="h-3.5 w-3.5 rounded-full border border-white/10 shadow-xs"
          style={{ backgroundColor: colors.background }}
          title={`Background: ${colors.background}`}
        />
        <span
          className="h-3.5 w-3.5 rounded-full border border-white/10 shadow-xs"
          style={{ backgroundColor: colors.surface }}
          title={`Surface: ${colors.surface}`}
        />
        <span
          className="h-3.5 w-3.5 rounded-full border border-white/10 shadow-xs"
          style={{ backgroundColor: colors.primary }}
          title={`Primary accent: ${colors.primary}`}
        />
        <span
          className="h-3.5 w-3.5 rounded-full border border-white/10 shadow-xs"
          style={{ backgroundColor: colors.secondaryAccent }}
          title={`Secondary accent: ${colors.secondaryAccent}`}
        />
        <span
          className="h-3.5 w-3.5 rounded-full border border-white/10 shadow-xs"
          style={{ backgroundColor: colors.aiAccent }}
          title={`AI accent: ${colors.aiAccent}`}
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-xl border p-2.5 transition-all duration-300",
        active ? "ring-2 ring-offset-2 ring-offset-background" : "hover:border-opacity-80",
        className,
      )}
      style={{
        backgroundColor: colors.background,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      {/* Miniature UI Mockup */}
      <div
        className="rounded-lg p-2.5 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
            <span
              className="h-1.5 w-10 rounded-full opacity-80"
              style={{ backgroundColor: colors.textPrimary }}
            />
          </div>
          <span
            className="rounded px-1.5 py-0.5 text-[8.5px] font-mono font-medium"
            style={{
              backgroundColor: `${colors.primary}25`,
              color: colors.primary,
            }}
          >
            LIVE
          </span>
        </div>

        {/* Content line */}
        <div className="space-y-1 my-2">
          <span
            className="block h-1.5 w-full rounded-full opacity-90"
            style={{ backgroundColor: colors.textPrimary }}
          />
          <span
            className="block h-1.5 w-3/4 rounded-full opacity-60"
            style={{ backgroundColor: colors.textSecondary }}
          />
        </div>

        {/* Swatch row at bottom of card */}
        <div className="mt-2.5 flex items-center justify-between pt-2 border-t" style={{ borderColor: `${colors.border}80` }}>
          <div className="flex items-center gap-1">
            <span
              className="h-3 w-3 rounded-full border border-white/10"
              style={{ backgroundColor: colors.background }}
              title="Main background"
            />
            <span
              className="h-3 w-3 rounded-full border border-white/10"
              style={{ backgroundColor: colors.surfaceElevated }}
              title="Elevated surface"
            />
            <span
              className="h-3 w-3 rounded-full border border-white/10"
              style={{ backgroundColor: colors.primary }}
              title="Primary accent"
            />
            <span
              className="h-3 w-3 rounded-full border border-white/10"
              style={{ backgroundColor: colors.secondaryAccent }}
              title="Secondary accent"
            />
            <span
              className="h-3 w-3 rounded-full border border-white/10"
              style={{ backgroundColor: colors.aiAccent }}
              title="AI accent"
            />
          </div>

          <span
            className="text-[9px] font-medium"
            style={{ color: colors.textSecondary }}
          >
            {theme.name.split(" ")[0]}
          </span>
        </div>
      </div>
    </div>
  );
}
