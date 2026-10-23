import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Compass, Eye, EyeOff, RotateCcw, Ruler, ArrowUpRight, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { triggerHologramEasterEgg } from "../easter-eggs/HiddenEasterEggs";

export interface ObjectStageLabels {
  rotate: string;
  reset: string;
  measure: string;
  vectors: string;
  angle: string;
  degrees: string;
  newton: string;
}

export interface DemoObjectStageProps {
  labels: ObjectStageLabels;
  variant: "rotating-body" | "matrix-board" | "pendulum" | "spring";
  language: LanguageCode;
  className?: string;
}

const LENGTH = 78;
const FORCE = 26;

/**
 * One participant's view of the teacher-controlled shared object.
 *
 * The instance is passed labels already resolved in that participant's
 * language, so five students can look at the same object at the same time
 * and each card reads its own language while the geometry stays in sync.
 */
export function DemoObjectStage({ labels, variant, language, className }: DemoObjectStageProps) {
  const reduced = useReducedMotion() ?? false;
  const bodyRef = useRef<SVGGElement | null>(null);
  const forceRef = useRef<SVGGElement | null>(null);
  const arcRef = useRef<SVGPathElement | null>(null);
  const angleRef = useRef(32);
  const frameRef = useRef<number | null>(null);
  const readoutRef = useRef<SVGTSpanElement | null>(null);

  const [rotating, setRotating] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  const [measuring, setMeasuring] = useState(false);
  const [angle, setAngle] = useState(32);
  const [hologramActive, setHologramActive] = useState(false);
  const hologramTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleHologram = () => {
      if (hologramTimerRef.current !== null) {
        window.clearTimeout(hologramTimerRef.current);
      }
      setHologramActive(true);
      hologramTimerRef.current = window.setTimeout(() => {
        setHologramActive(false);
        hologramTimerRef.current = null;
      }, 4200);
    };
    window.addEventListener("nexclass:hologram-scan", handleHologram);
    return () => {
      window.removeEventListener("nexclass:hologram-scan", handleHologram);
      if (hologramTimerRef.current !== null) {
        window.clearTimeout(hologramTimerRef.current);
      }
    };
  }, []);

  const applyTransform = useCallback((value: number) => {
    angleRef.current = value;
    if (bodyRef.current) {
      bodyRef.current.setAttribute("transform", `rotate(${value} 160 140)`);
    }
    if (forceRef.current) {
      forceRef.current.setAttribute("transform", `rotate(${value} 160 140)`);
    }
    if (arcRef.current) {
      const start = -90;
      const end = -90 + Math.max(-160, Math.min(160, value));
      const rad = (deg: number) => (deg * Math.PI) / 180;
      const x = 160 + 46 * Math.cos(rad(end));
      const y = 140 + 46 * Math.sin(rad(end));
      const large = Math.abs(end - start) > 180 ? 1 : 0;
      arcRef.current.setAttribute(
        "d",
        `M ${160 + 46 * Math.cos(rad(start))} ${140 + 46 * Math.sin(rad(start))} A 46 46 0 ${large} 1 ${x} ${y}`,
      );
    }
  }, []);

  useEffect(() => {
    applyTransform(angleRef.current);
  }, [applyTransform]);

  useEffect(() => {
    if (!rotating || reduced) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      return undefined;
    }
    let last = performance.now();
    let published = 0;
    const tick = (now: number) => {
      const delta = Math.min(48, now - last);
      last = now;
      const next = angleRef.current + (delta / 1000) * 42;
      applyTransform(((next % 360) + 360) % 360);
      if (now - published > 120) {
        published = now;
        setAngle(Math.round(angleRef.current));
        if (readoutRef.current) {
          readoutRef.current.textContent = `${Math.round(angleRef.current)}`;
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [applyTransform, reduced, rotating]);

  const torque = measuring
    ? (FORCE * LENGTH * Math.abs(Math.sin((angle * Math.PI) / 180))) / 100
    : 0;

  const controls = [
    {
      id: "rotate",
      label: labels.rotate,
      icon: Compass,
      active: rotating,
      onClick: () => {
        if (reduced) {
          const next = (angleRef.current + 15) % 360;
          applyTransform(next);
          setAngle(Math.round(next));
          return;
        }
        setRotating((value) => !value);
      },
    },
    {
      id: "reset",
      label: labels.reset,
      icon: RotateCcw,
      active: false,
      onClick: () => {
        setRotating(false);
        angleRef.current = 0;
        applyTransform(0);
        setAngle(0);
      },
    },
    {
      id: "measure",
      label: labels.measure,
      icon: Ruler,
      active: measuring,
      onClick: () => setMeasuring((value) => !value),
    },
    {
      id: "vectors",
      label: labels.vectors,
      icon: ArrowUpRight,
      active: showVectors,
      onClick: () => setShowVectors((value) => !value),
    },
  ];

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-xl border bg-ink-950/60 transition-all duration-300",
        hologramActive
          ? "border-sky-400/80 shadow-lg shadow-sky-500/25 ring-1 ring-sky-400/40"
          : "border-ink-700/80",
        className,
      )}
    >
      <svg
        viewBox="0 0 320 220"
        className="h-auto w-full cursor-pointer select-none"
        role="img"
        aria-label={labels.angle}
        lang={language}
        onDoubleClick={() => triggerHologramEasterEgg()}
      >
        <defs>
          <pattern id="nc-room-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeOpacity="0.45" strokeWidth="1" />
          </pattern>
          <linearGradient id="nc-room-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--secondary-accent)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <rect width="320" height="220" fill="url(#nc-room-grid)" />

        {hologramActive && !reduced ? (
          <g className="pointer-events-none">
            {/* Animated sweeping laser scan line */}
            <line
              x1="0"
              y1="10"
              x2="320"
              y2="10"
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              opacity="0.9"
            >
              <animate attributeName="y1" values="10; 210; 10" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="y2" values="10; 210; 10" dur="2.2s" repeatCount="indefinite" />
            </line>
            {/* Hologram corner target brackets */}
            <path
              d="M 10 24 L 10 10 L 24 10 M 310 24 L 310 10 L 296 10 M 10 196 L 10 210 L 24 210 M 310 196 L 310 210 L 296 210"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.5"
              opacity="0.85"
            />
            <text
              x="160"
              y="22"
              textAnchor="middle"
              fill="#38BDF8"
              fontSize="8.5"
              fontFamily="JetBrains Mono, monospace"
              letterSpacing="2"
              opacity="0.9"
            >
              ⚡ 3D HOLO-SCAN: MULTILINGUAL SYNC ACTIVE
            </text>
          </g>
        ) : null}

        {variant === "matrix-board" ? (
          <g opacity="0.85">
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 4 }).map((__, column) => (
                <rect
                  key={`${row}-${column}`}
                  x={70 + column * 46}
                  y={40 + row * 34}
                  width="38"
                  height="26"
                  rx="5"
                  fill="var(--primary)"
                  fillOpacity="0.12"
                  stroke="var(--primary)"
                  strokeOpacity="0.45"
                />
              )),
            )}
          </g>
        ) : null}

        {variant === "pendulum" ? (
          <g>
            <line x1="160" y1="26" x2="160" y2="52" stroke="var(--text-secondary)" strokeOpacity="0.5" strokeWidth="2" />
            <line
              x1="160"
              y1="52"
              x2={160 + 58 * Math.sin((angle * Math.PI) / 180)}
              y2={52 + 58 * Math.cos((angle * Math.PI) / 180)}
              stroke="var(--text-secondary)"
              strokeOpacity="0.75"
              strokeWidth="2.5"
            />
            <circle
              cx={160 + 58 * Math.sin((angle * Math.PI) / 180)}
              cy={52 + 58 * Math.cos((angle * Math.PI) / 180)}
              r="9"
              fill="var(--secondary-accent)"
              fillOpacity="0.9"
            />
          </g>
        ) : null}

        {variant === "spring" ? (
          <g>
            {Array.from({ length: 12 }).map((_, index) => (
              <line
                key={index}
                x1={40 + index * 20}
                y1="80"
                x2={52 + index * 20}
                y2="110"
                stroke="var(--primary)"
                strokeOpacity="0.7"
                strokeWidth="2"
              />
            ))}
            <rect x="280" y="62" width="14" height="66" rx="4" fill="var(--secondary-accent)" fillOpacity="0.5" />
          </g>
        ) : null}

        {variant === "rotating-body" ? (
          <>
            <circle cx="160" cy="140" r="7" fill="var(--text-secondary)" fillOpacity="0.85" />
            <path d="M 148 196 L 172 196" stroke="var(--text-secondary)" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
            <g ref={bodyRef}>
              <line
                x1="160"
                y1="140"
                x2={160 + LENGTH}
                y2="140"
                stroke="var(--text-secondary)"
                strokeOpacity="0.55"
                strokeWidth="3"
              />
              <rect
                x={160 + LENGTH - 12}
                y="128"
                width="24"
                height="24"
                rx="6"
                fill="url(#nc-room-body)"
                stroke="var(--primary)"
                strokeOpacity="0.75"
              />
            </g>
            {showVectors ? (
              <g ref={forceRef}>
                <line
                  x1={160 + LENGTH}
                  y1="140"
                  x2={160 + LENGTH}
                  y2={140 + FORCE}
                  stroke="var(--danger)"
                  strokeWidth="2.5"
                />
                <polygon
                  points={`${160 + LENGTH - 5},${140 + FORCE - 8} ${160 + LENGTH + 5},${
                    140 + FORCE - 8
                  } ${160 + LENGTH},${140 + FORCE}`}
                  fill="var(--danger)"
                />
              </g>
            ) : null}
            {measuring ? (
              <>
                <path
                  ref={arcRef}
                  fill="none"
                  stroke="var(--secondary-accent)"
                  strokeOpacity="0.9"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <text
                  x="212"
                  y="128"
                  fill="var(--secondary-accent)"
                  fontSize="12"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {torque.toFixed(1)} {labels.newton}
                </text>
              </>
            ) : null}
          </>
        ) : null}

        <text x="16" y="28" fill="var(--text-secondary)" fillOpacity="0.7" fontSize="11" fontFamily="Inter, sans-serif">
          {labels.angle}{" "}
          <tspan ref={readoutRef} fill="var(--primary)"></tspan> {labels.degrees}
        </text>
      </svg>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-ink-700/70 px-3 py-2">
        {controls.map((control) => {
          const Icon = control.icon;
          return (
            <button
              key={control.id}
              type="button"
              onClick={control.onClick}
              aria-pressed={control.active}
              className={clsx(
                "nc-focus inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-2xs font-medium transition-colors",
                control.active
                  ? "border-accent-400/45 bg-accent-400/12 text-accent-200"
                  : "border-ink-600 text-ivory-300 hover:text-ivory-50",
              )}
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              {control.label}
              {control.id === "vectors" ? (
                showVectors ? (
                  <Eye className="h-3 w-3 opacity-70" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-3 w-3 opacity-70" aria-hidden="true" />
                )
              ) : null}
            </button>
          );
        })}
        {hologramActive && (
          <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-sky-400/50 bg-sky-500/15 px-2 text-2xs font-semibold text-sky-200 animate-pulse">
            <Sparkles className="h-3 w-3 text-sky-300" aria-hidden="true" />
            Holo-Scan
          </span>
        )}
      </div>
    </div>
  );
}
