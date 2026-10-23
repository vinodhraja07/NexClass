import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  CircleAlert,
  Play,
  Rocket,
  RotateCcw,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import { DemoTransport } from "@/lib/demoTransport";
import { ClassroomShell } from "@/components/classroom/ClassroomShell";
import { Button, Badge } from "@/components/ui";

/**
 * The interactive demo classroom (Demo 1: captions & voice translation).
 *
 * Runs on top of DemoTransport, evaluating the real product surface with
 * simulated multi-language students and keyless fallback voice synthesis.
 */
export default function Demo() {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  const transport = useMemo(() => new DemoTransport(), []);
  const [playing, setPlaying] = useState(false);

  // Clean up transport on unmount
  useEffect(() => {
    return () => transport.disconnect();
  }, [transport]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaying(transport.playing);
    }, 700);
    return () => window.clearInterval(timer);
  }, [transport]);

  const togglePlayback = useCallback(() => {
    if (transport.playing) {
      transport.pausePlayback();
      setPlaying(false);
    } else {
      transport.startPlayback();
      setPlaying(true);
    }
  }, [transport]);

  const restart = useCallback(() => {
    transport.resetPlayback();
    transport.startPlayback();
    setPlaying(true);
  }, [transport]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink-900 text-ivory-100">
      {/* demo overview banner */}
      <div className="border-b border-ink-700/70 bg-ink-850/60 px-3.5 py-2 sm:px-5">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Badge tone="warn">
              <CircleAlert className="h-3 w-3" aria-hidden="true" />
              Demo 1 - captions &amp; voice translation
            </Badge>

            <Button
              size="sm"
              variant={playing ? "secondary" : "primary"}
              icon={
                playing ? (
                  <span className="flex items-center gap-0.5 h-3.5 mr-0.5" aria-hidden="true">
                    {[0.4, 0.9, 1, 0.6].map((scale, i) => (
                      <motion.span
                        key={i}
                        animate={reduced ? {} : { scaleY: [0.25, scale, 0.25] }}
                        transition={{ repeat: Infinity, duration: 0.65 + i * 0.15, ease: "easeInOut" }}
                        className="w-0.5 h-3 rounded-full bg-accent-300 origin-bottom"
                      />
                    ))}
                  </span>
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                )
              }
              className={
                playing
                  ? clsx(
                      "h-8 border-accent-400/50 bg-accent-400/15 text-accent-200 shadow-sm shadow-accent-400/20 text-xs",
                      !reduced && "animate-pulse",
                    )
                  : "h-8 shadow-md shadow-accent-400/25 text-xs"
              }
              onClick={togglePlayback}
            >
              {playing ? "Pause lecture" : "Play lecture"}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
              className="h-8 text-xs text-ivory-200 hover:text-ivory-50 border border-ink-600/60 hover:bg-ink-800"
              onClick={restart}
            >
              Restart
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Button to Demo 2 */}
            <Link
              to="/demo/room"
              className="nc-focus inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl bg-accent-400 px-3 text-xs font-semibold text-ink-900 transition-all hover:bg-accent-300 shadow-md shadow-accent-400/25 active:scale-95"
            >
              <Boxes className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Move to Demo 2</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>

            <Link
              to="/demo"
              className="nc-focus inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-ink-500 bg-ink-800/80 px-2.5 text-xs font-medium text-ivory-100 transition-colors hover:border-accent-400/50"
            >
              All demos
            </Link>
            <Link
              to="/register"
              className="nc-focus inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-ink-500 bg-ink-800/80 px-2.5 text-xs font-semibold text-ivory-100 transition-colors hover:border-accent-400/50"
            >
              <Rocket className="h-3 w-3" aria-hidden="true" />
              Create real classroom
            </Link>
          </div>
        </div>
      </div>

      {/* the classroom itself - the identical shell from the live room */}
      <div className="flex-1 min-h-0">
        <ClassroomShell
          transport={transport}
          simulated
          meetingCode="DEMO01"
          name={transport.self.displayName}
          language={transport.self.preferredLanguage}
          voiceActive={playing}
          onLeft={() => navigate("/")}
        />
      </div>
    </div>
  );
}
