import { Activity, BadgeCheck, CircleAlert, Server, TriangleAlert } from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { Badge } from "@/components/ui";

export interface ProviderStatusData {
  providers: {
    category: string;
    configured: boolean;
    provider: string;
    detail: string;
    envVars: string[];
  }[];
  languages: LanguageCode[];
  terminology: {
    total: number;
    approved: number;
    needsReview: number;
    draft: number;
  };
  infrastructure: {
    mongodb: { connected: boolean; fallback: boolean };
    redis: { connected: boolean };
  };
  demoMode: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  asr: "Speech recognition",
  translation: "Translation",
  tts: "Text-to-Speech",
  turn: "Network relay",
};

export interface ProviderStatusBarProps {
  status: ProviderStatusData | null;
  loading?: boolean;
  error?: string | null;
}

/**
 * Truthful provider readout. A provider is only ever shown as ready when the
 * server says it is configured.
 */
export function ProviderStatusBar({ status, loading = false, error = null }: ProviderStatusBarProps) {
  if (loading) {
    return (
      <div className="nc-panel flex items-center gap-3 px-4 py-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-500" aria-hidden="true" />
        <span className="text-2xs text-ivory-400">Checking provider configuration…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="status"
        className="nc-panel flex items-center gap-3 border-signal-warn/30 px-4 py-3"
      >
        <TriangleAlert className="h-4 w-4 shrink-0 text-signal-warn" aria-hidden="true" />
        <p className="text-2xs text-ivory-300">
          Provider status unavailable - {error}
        </p>
      </div>
    );
  }

  if (!status) return null;

  const translation = status.providers.find((entry) => entry.category === "translation");
  const tts = status.providers.find((entry) => entry.category === "tts");

  return (
    <section
      aria-label="Provider readiness"
      className="nc-panel flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center"
    >
      <div className="flex items-center gap-2">
        <Server className="h-3.5 w-3.5 text-ivory-400" aria-hidden="true" />
        <span className="nc-eyebrow">Provider readiness</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {status.providers.map((provider) => (
          <span
            key={provider.category}
            title={provider.detail}
            className="inline-flex items-center gap-2 text-2xs"
          >
            <span
              className={clsx(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                provider.configured ? "bg-accent-400" : "bg-signal-warn",
              )}
              aria-hidden="true"
            />
            <span className="text-ivory-200">
              {CATEGORY_LABELS[provider.category] ?? provider.category}
            </span>
            <span className={provider.configured ? "text-accent-300/90" : "text-signal-warn/90"}>
              {provider.configured ? provider.provider : "not configured"}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 lg:ml-auto">
        {status.demoMode ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-500/60 bg-ink-700/80 px-2.5 py-1 text-2xs font-semibold text-ivory-300">
            <Activity className="h-3 w-3" aria-hidden="true" />
            Demo mode
          </span>
        ) : null}
        {translation?.configured ? (
          <Badge tone="accent">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
            Translation ready
          </Badge>
        ) : (
          <Badge tone="warn">
            <CircleAlert className="h-3 w-3" aria-hidden="true" />
            Captions stay in the original language
          </Badge>
        )}
        {tts?.configured ? (
          <Badge tone="accent">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
            Voice ready
          </Badge>
        ) : (
          <Badge tone="warn">
            <CircleAlert className="h-3 w-3" aria-hidden="true" />
            Voice not configured
          </Badge>
        )}
      </div>
    </section>
  );
}
