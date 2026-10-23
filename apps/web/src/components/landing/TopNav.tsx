import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@/components/ui";
import { Wordmark } from "./Wordmark";
import { Container } from "./Primitives";

export const NAV_LINKS = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How it works" },
  { id: "features", label: "Features" },
  { id: "languages", label: "Language" },
  { id: "accessibility", label: "Accessibility" },
  { id: "privacy", label: "Privacy" },
] as const;

export type LandingNavTab = (typeof NAV_LINKS)[number]["id"];

export interface TopNavProps {
  activeTab?: LandingNavTab;
  onSelectTab?: (tab: LandingNavTab) => void;
}

export function TopNav({ activeTab = "overview", onSelectTab }: TopNavProps) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleLinkClick = (id: LandingNavTab) => {
    if (onSelectTab) {
      onSelectTab(id);
    }
  };

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-ink-700/80 bg-ink-950/85 backdrop-blur-xl"
          : "border-transparent bg-ink-950/40 backdrop-blur-sm",
      ].join(" ")}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => {
              if (onSelectTab) {
                onSelectTab("overview");
              }
              window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
            }}
            className="nc-focus rounded-lg cursor-pointer"
            aria-label="NexClass home"
          >
            <Wordmark />
          </button>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => handleLinkClick(link.id)}
                    className={clsx(
                      "nc-focus inline-flex h-9 items-center rounded-lg px-3 text-[13.5px] transition-all duration-200 cursor-pointer",
                      activeTab === link.id
                        ? "bg-accent-400/15 text-accent-300 font-semibold border border-accent-400/35 shadow-sm"
                        : "text-ivory-300 hover:bg-ink-800 hover:text-ivory-50 border border-transparent",
                    )}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="ghost" size="sm" onClick={() => go("/join")}>
              Join class
            </Button>
            <Button variant="ghost" size="sm" onClick={() => go("/login")}>
              Sign in
            </Button>
            <Button variant="secondary" size="sm" onClick={() => go("/demo")}>
              Try demo
            </Button>
            <Button size="sm" onClick={() => go("/dashboard")}>
              Host classroom
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => go("/join")}
            >
              Join
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => go("/demo")}
            >
              Try demo
            </Button>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="nc-focus inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-600 bg-ink-850 text-ivory-200 transition-colors hover:text-ivory-50 lg:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </Container>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden border-t border-ink-700/70 bg-ink-950/95 backdrop-blur-xl lg:hidden"
          >
            <Container className="py-4">
              <nav aria-label="Mobile">
                <ul className="flex flex-col">
                  {NAV_LINKS.map((link) => (
                    <li key={link.id}>
                      <button
                        type="button"
                        onClick={() => {
                          handleLinkClick(link.id);
                          setOpen(false);
                        }}
                        className={clsx(
                          "nc-focus block w-full text-left rounded-lg px-3 py-2.5 text-[15px] transition-colors",
                          activeTab === link.id
                            ? "bg-accent-400/15 text-accent-300 font-semibold"
                            : "text-ivory-200 hover:text-ivory-50 hover:bg-ink-850",
                        )}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-4 grid gap-2 border-t border-ink-700/70 pt-4">
                <Button onClick={() => go("/join")}>Join a class with code</Button>
                <Button variant="secondary" onClick={() => go("/demo")}>Try demo</Button>
                <Button variant="ghost" onClick={() => go("/register")}>
                  Create a classroom
                </Button>
                <Button variant="quiet" onClick={() => go("/login")}>
                  Sign in
                </Button>
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
