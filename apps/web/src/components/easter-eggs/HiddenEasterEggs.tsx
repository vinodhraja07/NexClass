import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles, Gamepad2, Volume2, Wand2 } from "lucide-react";

export type VisualizerMode = "bars" | "rings" | "pulsar";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  char: string;
  rotation: number;
  spin: number;
  opacity: number;
}

const GLYPHS = ["அ", "क", "ব", "म", "ଅ", "A", "✦", "★", "✨", "🚀", "Ω", "π"];
const COLORS = [
  "#2EE0A8", // Emerald Accent
  "#D3F25C", // Lime Accent
  "#8B5CF6", // Purple Accent
  "#38BDF8", // Sky Blue
  "#F43F5E", // Rose
  "#FBBF24", // Amber Gold
];

// Custom DOM Event Dispatchees
export function triggerLogoTap(e?: React.MouseEvent | React.TouchEvent) {
  let x = window.innerWidth / 2;
  let y = 80;
  if (e && "clientX" in e) {
    x = e.clientX;
    y = e.clientY;
  } else if (e && "touches" in e && e.touches[0]) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  }
  window.dispatchEvent(new CustomEvent("nexclass:logo-tap", { detail: { x, y } }));
}

export function triggerVisualizerModeToggle() {
  window.dispatchEvent(new CustomEvent("nexclass:toggle-visualizer"));
}

export function triggerHologramEasterEgg() {
  window.dispatchEvent(new CustomEvent("nexclass:hologram-scan"));
}

// Global visualizer mode hook
export function useVisualizerMode(): [VisualizerMode, () => void] {
  const [mode, setMode] = useState<VisualizerMode>(() => {
    if (typeof window === "undefined") return "bars";
    return (localStorage.getItem("nexclass_vis_mode") as VisualizerMode) || "bars";
  });

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: VisualizerMode = prev === "bars" ? "rings" : prev === "rings" ? "pulsar" : "bars";
      try {
        localStorage.setItem("nexclass_vis_mode", next);
      } catch {
        /* ignore */
      }
      triggerVisualizerModeToggle();
      return next;
    });
  }, []);

  useEffect(() => {
    const handleSync = () => {
      const current = (localStorage.getItem("nexclass_vis_mode") as VisualizerMode) || "bars";
      setMode(current);
    };
    window.addEventListener("nexclass:toggle-visualizer", handleSync);
    return () => window.removeEventListener("nexclass:toggle-visualizer", handleSync);
  }, []);

  return [mode, toggle];
}

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function HiddenEasterEggs() {
  const reduce = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [toast, setToast] = useState<{ title: string; subtitle: string; icon: string } | null>(null);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>("bars");

  // Konami Code Detection
  useEffect(() => {
    let keyCursor = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      const expected = KONAMI_SEQUENCE[keyCursor].toLowerCase();
      if (e.key.toLowerCase() === expected) {
        keyCursor += 1;
        if (keyCursor === KONAMI_SEQUENCE.length) {
          keyCursor = 0;
          launchKonamiParty();
        }
      } else {
        keyCursor = e.key.toLowerCase() === KONAMI_SEQUENCE[0].toLowerCase() ? 1 : 0;
      }

      // Secret quick shortcut: Shift + E
      if (e.shiftKey && e.key.toLowerCase() === "e") {
        launchKonamiParty();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Logo Multi-Tap Listener (5 taps in <2.2s)
  useEffect(() => {
    let tapCount = 0;
    let resetTimer: number | null = null;

    const handleLogoTap = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      tapCount += 1;

      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        tapCount = 0;
      }, 2200);

      if (tapCount >= 5) {
        tapCount = 0;
        launchGlyphFountain(customEvent.detail?.x ?? window.innerWidth / 2, customEvent.detail?.y ?? 80);
      }
    };

    window.addEventListener("nexclass:logo-tap", handleLogoTap);
    return () => window.removeEventListener("nexclass:logo-tap", handleLogoTap);
  }, []);

  // Visualizer Notification
  useEffect(() => {
    const handleVisualizerToggle = () => {
      const current = (localStorage.getItem("nexclass_vis_mode") as VisualizerMode) || "bars";
      setVisualizerMode(current);
      const names: Record<VisualizerMode, { name: string; desc: string }> = {
        bars: { name: "Dynamic Equalizer Bars", desc: "Classic audio frequency bars" },
        rings: { name: "Kinetic Neon Rings", desc: "Concentric sound wave radar ripples" },
        pulsar: { name: "Radiant Quantum Pulsar", desc: "Nebula dot wave sound pulsation" },
      };
      setToast({
        title: `🎛️ Visualizer Mode: ${names[current].name}`,
        subtitle: names[current].desc,
        icon: "visualizer",
      });
      window.setTimeout(() => setToast(null), 3200);
    };

    window.addEventListener("nexclass:toggle-visualizer", handleVisualizerToggle);
    return () => window.removeEventListener("nexclass:toggle-visualizer", handleVisualizerToggle);
  }, []);

  // Hologram Scan Notification
  useEffect(() => {
    const handleHologram = () => {
      setToast({
        title: "⚡ Holographic Geometry Scan Activated!",
        subtitle: "3D synchronized multilingual object scan mode discovered",
        icon: "hologram",
      });
      window.setTimeout(() => setToast(null), 3600);
    };
    window.addEventListener("nexclass:hologram-scan", handleHologram);
    return () => window.removeEventListener("nexclass:hologram-scan", handleHologram);
  }, []);

  const launchKonamiParty = () => {
    setToast({
      title: "🎮 KONAMI CODE UNLOCKED!",
      subtitle: "Multilingual Starlight Matrix Celebration Activated! ✨",
      icon: "gamepad",
    });
    window.setTimeout(() => setToast(null), 4200);

    const count = reduce ? 15 : 65;
    const nextParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 4 + Math.random() * 9;
      nextParticles.push({
        id: Math.random() + Date.now(),
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
        vy: Math.sin(angle) * speed - (2 + Math.random() * 5),
        size: 16 + Math.random() * 18,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }
    setParticles((prev) => [...prev, ...nextParticles]);
  };

  const launchGlyphFountain = (originX: number, originY: number) => {
    setToast({
      title: "🌟 Secret Discovered: Multilingual Glyph Fountain!",
      subtitle: "Tapped logo 5 times · Indic language glyph burst unlocked",
      icon: "wand",
    });
    window.setTimeout(() => setToast(null), 3800);

    const count = reduce ? 12 : 45;
    const nextParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const speed = 5 + Math.random() * 8;
      const spread = (Math.random() - 0.5) * 6;
      nextParticles.push({
        id: Math.random() + Date.now() + i,
        x: originX,
        y: originY,
        vx: spread,
        vy: -speed,
        size: 15 + Math.random() * 16,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }
    setParticles((prev) => [...prev, ...nextParticles]);
  };

  // Particle Physics Animation Loop
  useEffect(() => {
    if (particles.length === 0) return;

    let frameId: number;
    const tick = () => {
      setParticles((current) =>
        current
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.22, // gravity
            rotation: p.rotation + p.spin,
            opacity: p.opacity - 0.012, // fade out
          }))
          .filter((p) => p.opacity > 0 && p.y < window.innerHeight + 60),
      );
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [particles.length]);

  return (
    <>
      {/* Floating Canvas Particle Layer */}
      {particles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden select-none" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                transform: `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg)`,
                fontSize: `${p.size}px`,
                color: p.color,
                opacity: p.opacity,
                textShadow: `0 0 12px ${p.color}88, 0 0 24px ${p.color}44`,
              }}
              className="absolute left-0 top-0 font-display font-bold leading-none will-change-transform"
            >
              {p.char}
            </div>
          ))}
        </div>
      )}

      {/* Secret Toast / Achievement Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3.5 rounded-2xl border border-accent-400/50 bg-[#161426]/95 px-5 py-3 shadow-[0_12px_36px_rgba(46,224,168,0.25)] backdrop-blur-2xl ring-1 ring-white/10"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-400/20 text-accent-300 shadow-inner shadow-accent-400/20">
              {toast.icon === "gamepad" ? (
                <Gamepad2 className="h-5 w-5 animate-pulse" />
              ) : toast.icon === "visualizer" ? (
                <Volume2 className="h-5 w-5 animate-bounce" />
              ) : toast.icon === "hologram" ? (
                <Sparkles className="h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5 animate-pulse" />
              )}
            </div>
            <div>
              <p className="font-display text-[13.5px] font-bold tracking-tight text-ivory-50 flex items-center gap-2">
                <span>{toast.title}</span>
                <span className="rounded-full bg-accent-400/20 px-2 py-0.5 text-3xs font-semibold text-accent-300 uppercase">
                  Easter Egg
                </span>
              </p>
              <p className="text-2xs text-ivory-300 font-medium">{toast.subtitle}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
