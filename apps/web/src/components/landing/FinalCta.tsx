import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { Container, Reveal } from "./Primitives";

export function FinalCta() {
  const navigate = useNavigate();

  return (
    <section
      aria-label="Get started"
      className="relative scroll-mt-20 border-t border-ivory-200 bg-ivory-50 py-20 text-ink-900 sm:py-24 lg:py-28"
    >
      <Container>
        <div className="mx-auto max-w-[820px] text-center">
          <Reveal>
            <p className="nc-eyebrow flex items-center justify-center gap-2.5 !text-ink-600/80">
              <span className="h-px w-6 bg-accent-600" aria-hidden="true" />
              Get started
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="mt-6 text-balance text-[32px] leading-[1.06] font-semibold tracking-[-0.03em] text-ink-950 sm:text-[44px] lg:text-[52px]">
              Bring the room to everyone&apos;s language.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-[560px] text-balance text-[15px] leading-relaxed text-ink-700/85 sm:text-[17px]">
              Open the interactive demo to see one live sentence rendered in six
              languages, or create a classroom and run your own session.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
            <p className="mt-8 text-[12.5px] leading-relaxed text-ink-600">
              The demo runs in your browser using prepared sample segments. Live rooms
              translate the teacher as they speak.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
