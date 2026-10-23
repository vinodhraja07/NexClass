import { useNavigate } from "react-router-dom";
import { LANGUAGES } from "@nexclass/shared";
import { Container } from "./Primitives";
import { Wordmark } from "./Wordmark";

const PRODUCT_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#languages", label: "Language" },
  { href: "#terminology", label: "Terminology" },
  { href: "#accessibility", label: "Accessibility" },
  { href: "#privacy", label: "Privacy" },
];

export function SiteFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-ink-700/70 bg-ink-950 py-14">
      <Container>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[320px] text-[13px] leading-relaxed text-ivory-400">
              A live classroom where one teacher and one meeting can be understood in
              every language in the room.
            </p>
          </div>

          <nav aria-label="Product">
            <p className="nc-eyebrow">Product</p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="nc-focus rounded text-[13.5px] text-ivory-300 transition-colors duration-200 hover:text-ivory-50"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Get started">
            <p className="nc-eyebrow">Get started</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/demo")}
                  className="nc-focus rounded text-[13.5px] text-ivory-300 transition-colors duration-200 hover:text-ivory-50"
                >
                  Try the demo
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="nc-focus rounded text-[13.5px] text-ivory-300 transition-colors duration-200 hover:text-ivory-50"
                >
                  Create a classroom
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="nc-focus rounded text-[13.5px] text-ivory-300 transition-colors duration-200 hover:text-ivory-50"
                >
                  Sign in
                </button>
              </li>
            </ul>
          </nav>

          <div>
            <p className="nc-eyebrow">Caption languages</p>
            <ul className="mt-4 space-y-2.5">
              {LANGUAGES.map((language) => (
                <li key={language.code} className="text-[13.5px] text-ivory-300">
                  {language.name}
                  <span className="ml-2 text-ivory-400/70">{language.nativeName}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11.5px] tracking-wide text-ivory-400/80">
            &copy; 2026 NexClass
          </p>
          <p className="max-w-[520px] text-[11.5px] leading-relaxed text-ivory-400/80">
            The caption samples on this page are hand-authored prepared segments used
            to demonstrate the interface. Live classrooms translate the teacher&apos;s
            speech as it happens and always keep the original transcript.
          </p>
        </div>
      </Container>
    </footer>
  );
}
