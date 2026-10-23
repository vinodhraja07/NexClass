import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { Container, Reveal } from "./Primitives";

export function FinalCta() {
  const navigate = useNavigate();

  return (
    <section
      aria-label="Get started"
      className="relative scroll-mt-20 overflow-hidden border-t border-ink-700/80 bg-gradient-to-b from-ink-900 via-ink-950 to-ink-900 py-24 text-ivory-50 sm:py-28"
    >
      {/* Ambient background glow orb */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[320px] w-[640px] rounded-full bg-gradient-to-t from-accent-500/15 via-lime-400/8 to-transparent blur-[120px]"
        aria-hidden="true"
      />

      <Container className="relative">
        <div className="mx-auto max-w-[820px] text-center">
          <Reveal>
            <p className="nc-eyebrow flex items-center justify-center gap-2.5 text-accent-300">
              <span className="h-px w-6 bg-accent-400" aria-hidden="true" />
              Get started
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="mt-6 text-balance text-[32px] leading-[1.06] font-semibold tracking-[-0.03em] text-ivory-50 sm:text-[44px] lg:text-[54px]">
              Bring the room to{" "}
              <span className="bg-gradient-to-r from-accent-300 via-lime-300 to-accent-400 bg-clip-text text-transparent">
                everyone&apos;s language.
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-[560px] text-balance text-[15px] leading-relaxed text-ivory-300/85 sm:text-[17px]">
              Open the interactive demo to see one live sentence rendered in six
              languages, or create a classroom and run your own session.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <Button
                size="lg"
                onClick={() => navigate("/demo")}
                icon={<Play className="h-4 w-4" aria-hidden="true" />}
              >
                Try the interactive demo
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/register")}
                trailing={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                Create a classroom
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 text-[12.5px] leading-relaxed text-ivory-400">
              The demo runs in your browser using prepared sample segments. Live rooms
              translate the teacher as they speak.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
