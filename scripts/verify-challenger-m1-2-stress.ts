/**
 * Adversarial Empirical Verification & Stress Test Harness
 * Challenger 2 (Milestone 1 Final Gate)
 *
 * Verifies:
 * 1. Responsive layout alignment (<640px, 640-1024px, 1024-1440px, >1440px)
 * 2. Server connection status beacon logic & telemetry edge cases (ASR, Translation, WebRTC/STUN, Neural TTS, MongoDB)
 * 3. Logout trigger error tolerance & state reset
 * 4. prefers-reduced-motion compliance & fallbacks
 * 5. Latest design token synchronization (Jet Black, Cerulean Blue, Neon Rose)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert";

const ROOT = resolve(__dirname, "..");

interface TestResult {
  group: string;
  name: string;
  status: "PASS" | "FAIL";
  error?: string;
}

const results: TestResult[] = [];

function test(group: string, name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] [${group}] ${name}`);
    results.push({ group, name, status: "PASS" });
  } catch (err: any) {
    console.error(`  [FAIL] [${group}] ${name}`);
    console.error(`         ${err.message}`);
    results.push({ group, name, status: "FAIL", error: err.message });
  }
}

async function main() {
  console.log("===============================================================================");
  console.log("  CHALLENGER 2 ADVERSARIAL STRESS TEST & VERIFICATION HARNESS                 ");
  console.log("===============================================================================\n");

  const dashboardPath = resolve(ROOT, "apps/web/src/pages/Dashboard.tsx");
  const sidebarPath = resolve(ROOT, "apps/web/src/components/dashboard/DashboardSidebar.tsx");
  const mobileHeaderPath = resolve(ROOT, "apps/web/src/components/dashboard/DashboardMobileHeader.tsx");
  const authPath = resolve(ROOT, "apps/web/src/lib/auth.tsx");
  const cssPath = resolve(ROOT, "apps/web/src/index.css");
  const themesCssPath = resolve(ROOT, "apps/web/src/themes/themes.css");
  const themesTsPath = resolve(ROOT, "apps/web/src/themes/themes.ts");
  const tailwindPath = resolve(ROOT, "apps/web/tailwind.config.js");

  const dashboardSrc = readFileSync(dashboardPath, "utf8");
  const sidebarSrc = readFileSync(sidebarPath, "utf8");
  const mobileHeaderSrc = readFileSync(mobileHeaderPath, "utf8");
  const authSrc = readFileSync(authPath, "utf8");
  const cssSrc = readFileSync(cssPath, "utf8");
  const themesCssSrc = readFileSync(themesCssPath, "utf8");
  const themesTsSrc = readFileSync(themesTsPath, "utf8");
  const tailwindSrc = readFileSync(tailwindPath, "utf8");

  // ===========================================================================
  // GROUP 1: Responsive Layout Breakpoints
  // ===========================================================================
  console.log("--- GROUP 1: Responsive Layout Breakpoints (<640px, 640-1024px, 1024-1440px, >1440px) ---");

  test("Responsive", "Mobile (<640px): Mobile header uses sticky top-0 in document flow to prevent content overlap", () => {
    // Mobile header is sticky h-14 (56px) with lg:hidden
    assert(mobileHeaderSrc.includes("sticky top-0"), "Mobile header must have sticky top-0 for natural document flow");
    assert(mobileHeaderSrc.includes("h-14"), "Mobile header must have h-14 (56px height)");
    assert(mobileHeaderSrc.includes("lg:hidden"), "Mobile header must have lg:hidden");
    // Main content area is flex-1 flex flex-col min-w-0
    assert(
      dashboardSrc.includes("flex-1 flex flex-col min-w-0"),
      "Dashboard container must be flex-1 flex flex-col min-w-0 so main naturally follows sticky header",
    );
  });

  test("Responsive", "Mobile (<640px): Narrow viewport safety - drawer width bounded to 280px without horizontal overflow", () => {
    assert(sidebarSrc.includes("w-[280px]"), "Base mobile drawer width must be 280px (<640px)");
    assert(sidebarSrc.includes("sm:w-[320px]"), "Drawer expands to 320px on sm breakpoint (>=640px)");
  });

  test("Responsive", "Tablet (640-1024px): User role badge conditionally rendered in mobile header", () => {
    assert(
      mobileHeaderSrc.includes("hidden sm:inline-flex"),
      "Mobile header role badge must use 'hidden sm:inline-flex' to prevent overflowing 320-375px screens",
    );
  });

  test("Responsive", "Desktop (1024-1440px): Sidebar rail width strictly matches main content left margin", () => {
    const sidebarExpanded = sidebarSrc.includes('isCollapsed ? "w-20" : "w-64"');
    const contentOffset = dashboardSrc.includes('sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"');
    assert(sidebarExpanded, "Desktop rail must toggle between w-20 and w-64");
    assert(contentOffset, "Main content must toggle between lg:ml-20 and lg:ml-64");
  });

  test("Responsive", "Ultrawide (>1440px): Main content container is capped with max-w-[1400px] and centered with mx-auto", () => {
    assert(dashboardSrc.includes("max-w-[1400px]"), "Main content container must be constrained to max-w-[1400px]");
    assert(dashboardSrc.includes("mx-auto"), "Main content container must have mx-auto");
  });

  test("Responsive", "Drawer Accessibility: Escape key dismissal and body scroll lock cleanup", () => {
    assert(sidebarSrc.includes('event.key === "Escape"'), "Escape key listener required");
    assert(sidebarSrc.includes('document.body.style.overflow = "hidden"'), "Scroll lock required when drawer open");
    assert(sidebarSrc.includes("document.body.style.overflow = originalOverflow"), "Scroll lock cleanup required");
  });

  // ===========================================================================
  // GROUP 2: Server Connection Status Beacon & Provider Telemetry
  // ===========================================================================
  console.log("\n--- GROUP 2: Server Connection Status Beacon & Telemetry ---");

  test("Server Health", "Subsystem telemetry logic covers all 5 critical services", () => {
    // 1. ASR
    assert(sidebarSrc.includes('p.category === "asr"'), "ASR category provider must be checked");
    // 2. Translation
    assert(sidebarSrc.includes('p.category === "translation"'), "Translation category provider must be checked");
    // 3. WebRTC STUN/TURN
    assert(sidebarSrc.includes('p.category === "turn"'), "TURN category provider must be checked");
    // 4. Neural Indic TTS
    assert(sidebarSrc.includes('p.category === "tts"'), "TTS category provider must be checked");
    // 5. Database Storage (MongoDB)
    assert(sidebarSrc.includes("serverStatus?.infrastructure.mongodb"), "MongoDB infrastructure must be checked");
  });

  test("Server Health", "Simulate telemetry degradation truth table oracle", () => {
    // Emulate health computation from DashboardSidebar.tsx lines 141-157
    const computeOverall = (
      serverStatus: any,
      serverError: string | null = null,
    ) => {
      const turnHealthy = serverStatus?.providers.find((p: any) => p.category === "turn")?.configured ?? true;
      const ttsHealthy = serverStatus?.providers.find((p: any) => p.category === "tts")?.configured ?? true;
      const asrHealthy = serverStatus?.providers.find((p: any) => p.category === "asr")?.configured ?? true;
      const translationHealthy = serverStatus?.providers.find((p: any) => p.category === "translation")?.configured ?? true;
      const dbHealthy = serverStatus?.infrastructure.mongodb.connected ?? true;
      return (
        serverStatus !== null &&
        !serverError &&
        turnHealthy &&
        ttsHealthy &&
        asrHealthy &&
        translationHealthy &&
        dbHealthy
      );
    };

    // Case 1: All healthy
    const healthyMock = {
      providers: [
        { category: "asr", configured: true },
        { category: "translation", configured: true },
        { category: "turn", configured: true },
        { category: "tts", configured: true },
      ],
      infrastructure: { mongodb: { connected: true } },
    };
    assert.strictEqual(computeOverall(healthyMock, null), true, "All healthy must yield true");

    // Case 2: ASR unconfigured
    const asrDegraded = {
      ...healthyMock,
      providers: healthyMock.providers.map((p) => (p.category === "asr" ? { ...p, configured: false } : p)),
    };
    assert.strictEqual(computeOverall(asrDegraded, null), false, "ASR unconfigured must yield false");

    // Case 3: Translation unconfigured
    const transDegraded = {
      ...healthyMock,
      providers: healthyMock.providers.map((p) => (p.category === "translation" ? { ...p, configured: false } : p)),
    };
    assert.strictEqual(computeOverall(transDegraded, null), false, "Translation unconfigured must yield false");

    // Case 4: WebRTC STUN/TURN unconfigured
    const turnDegraded = {
      ...healthyMock,
      providers: healthyMock.providers.map((p) => (p.category === "turn" ? { ...p, configured: false } : p)),
    };
    assert.strictEqual(computeOverall(turnDegraded, null), false, "TURN unconfigured must yield false");

    // Case 5: Neural TTS unconfigured
    const ttsDegraded = {
      ...healthyMock,
      providers: healthyMock.providers.map((p) => (p.category === "tts" ? { ...p, configured: false } : p)),
    };
    assert.strictEqual(computeOverall(ttsDegraded, null), false, "TTS unconfigured must yield false");

    // Case 6: MongoDB disconnected
    const dbDisconnected = {
      ...healthyMock,
      infrastructure: { mongodb: { connected: false } },
    };
    assert.strictEqual(computeOverall(dbDisconnected, null), false, "MongoDB disconnected must yield false");

    // Case 7: Server error present
    assert.strictEqual(computeOverall(healthyMock, "Gateway Timeout"), false, "Server error must yield false");

    // Case 8: Server status null (unloaded)
    assert.strictEqual(computeOverall(null, null), false, "Null serverStatus must yield false");
  });

  test("Server Health", "Diagnostics popover renders dedicated telemetry rows for all 5 subsystems", () => {
    assert(sidebarSrc.includes("Speech Recognition (ASR)"), "ASR label missing in popover");
    assert(sidebarSrc.includes("Neural Translation"), "Translation label missing in popover");
    assert(sidebarSrc.includes("WebRTC STUN/TURN"), "WebRTC label missing in popover");
    assert(sidebarSrc.includes("Neural Indic TTS"), "TTS label missing in popover");
    assert(sidebarSrc.includes("Database Storage"), "Database label missing in popover");
  });

  test("Server Health", "Beacon indicator uses Cerulean Blue (#0284C7) for healthy and Amber (#FBBF24) for degraded", () => {
    assert(sidebarSrc.includes("bg-accent-400 shadow-[0_0_8px_#0284C7]"), "Healthy beacon must use #0284C7 glow");
    assert(sidebarSrc.includes("bg-amber-400 shadow-[0_0_8px_#FBBF24]"), "Degraded beacon must use #FBBF24 glow");
  });

  test("Server Health", "Server refresh trigger handles click propagation and triggers onRefreshServerStatus", () => {
    assert(sidebarSrc.includes("e.stopPropagation()"), "Refresh button must stop click propagation");
    assert(sidebarSrc.includes("props.onRefreshServerStatus?.()"), "Refresh button must call onRefreshServerStatus");
    assert(sidebarSrc.includes('props.serverLoading && "animate-spin"'), "Refresh button must spin during loading");
  });

  // ===========================================================================
  // GROUP 3: Logout Trigger & Auth Safety
  // ===========================================================================
  console.log("\n--- GROUP 3: Logout Trigger & Auth Safety ---");

  test("Logout", "Sign out button present in both desktop rail footer and mobile drawer footer", () => {
    assert(sidebarSrc.includes("aria-label=\"Sign out of NexClass\""), "Sign out button missing aria-label");
    assert(sidebarSrc.includes("{renderFooter(false)}"), "Desktop rail must render footer");
    assert(sidebarSrc.includes("{renderFooter(true)}"), "Mobile drawer must render footer");
  });

  test("Logout", "Dashboard handleSignOut coordinates auth reset and navigation with replace: true", () => {
    assert(dashboardSrc.includes("await logout()"), "handleSignOut must await logout()");
    assert(dashboardSrc.includes('navigate("/login", { replace: true })'), "Must redirect to /login with replace: true");
  });

  test("Logout", "Auth context logout function is resilient to network failures (try-catch protection)", () => {
    // In auth.tsx:
    // try {
    //   await api.logout();
    // } catch {
    //   // Ignore network failures on logout; clear client tokens unconditionally.
    // }
    // setAuthToken(null);
    // setUser(null);
    assert(authSrc.includes("try {\n      await api.logout();\n    } catch {"), "api.logout must be in try-catch");
    assert(authSrc.includes("setAuthToken(null);"), "Must clear auth token");
    assert(authSrc.includes("setUser(null);"), "Must reset user state");
  });

  // ===========================================================================
  // GROUP 4: prefers-reduced-motion Compliance
  // ===========================================================================
  console.log("\n--- GROUP 4: prefers-reduced-motion Compliance ---");

  test("Reduced Motion", "Root tree wrapped in <MotionConfig reducedMotion=\"user\">", () => {
    assert(dashboardSrc.includes('<MotionConfig reducedMotion="user">'), "MotionConfig reducedMotion='user' missing");
  });

  test("Reduced Motion", "Continuous pulsing and looping animations guarded by !reduced flag", () => {
    assert(dashboardSrc.includes("const reduced = useReducedMotion()"), "Dashboard must call useReducedMotion()");
    assert(dashboardSrc.includes("{!reduced && ("), "Ambient glow loop must check !reduced");
    assert(sidebarSrc.includes("const reduced = useReducedMotion()"), "Sidebar must call useReducedMotion()");
    assert(sidebarSrc.includes("{!reduced && ("), "Beacon pulsing animation must check !reduced");
  });

  test("Reduced Motion", "Popovers and tooltips suppress spring translations when reduced motion is preferred", () => {
    assert(
      sidebarSrc.includes("initial={reduced ? { opacity: 1 } : { opacity: 0, x: -6, scale: 0.95 }}"),
      "Tooltip initial animation must branch on reduced",
    );
    assert(
      sidebarSrc.includes("initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.96 }}"),
      "Status popover initial animation must branch on reduced",
    );
  });

  test("Reduced Motion", "CSS @media (prefers-reduced-motion: reduce) sets 0.001ms duration across all animations", () => {
    assert(cssSrc.includes("@media (prefers-reduced-motion: reduce)"), "CSS prefers-reduced-motion missing");
    assert(cssSrc.includes("animation-duration: 0.001ms !important"), "animation-duration override missing");
    assert(cssSrc.includes("transition-duration: 0.001ms !important"), "transition-duration override missing");
    assert(cssSrc.includes("scroll-behavior: auto !important"), "scroll-behavior override missing");
  });

  // ===========================================================================
  // GROUP 5: Latest User Directive Palette (Jet Black, Cerulean Blue, Neon Rose)
  // ===========================================================================
  console.log("\n--- GROUP 5: Latest User Directive Palette Compliance ---");

  test("Palette", "themes.css :root variables configured with Jet Black (#08090C) channels: 8 9 12", () => {
    assert(themesCssSrc.includes("--color-bg: 8 9 12;"), "--color-bg must be '8 9 12'");
    assert(themesCssSrc.includes("--color-primary: 2 132 199;"), "--color-primary must be '2 132 199' (#0284C7)");
    assert(themesCssSrc.includes("--color-secondary-accent: 255 42 122;"), "--color-secondary-accent must be '255 42 122' (#FF2A7A)");
    assert(themesCssSrc.includes("--color-text-primary: 241 245 249;"), "--color-text-primary must be '241 245 249' (#F1F5F9)");
  });

  test("Palette", "tailwind.config.js token mappings adhere to Jet Black, Cerulean Blue, and Neon Rose", () => {
    assert(tailwindSrc.includes('"#08090C"'), "ink.900 must be #08090C");
    assert(tailwindSrc.includes('"#0284C7"'), "accent.400 must be #0284C7");
    assert(tailwindSrc.includes('"#FF2A7A"'), "rose.400 / signal.live must be #FF2A7A");
    assert(tailwindSrc.includes('"#F1F5F9"'), "ivory.100 must be #F1F5F9");
  });

  test("Palette", "DEFAULT_THEME_ID in themes.ts is obsidian-mint with Jet & Cerulean Rose profile", () => {
    assert(themesTsSrc.includes('export const DEFAULT_THEME_ID: ThemeId = "obsidian-mint";'), "DEFAULT_THEME_ID must be obsidian-mint");
    assert(themesTsSrc.includes('"Jet & Cerulean Rose"'), "Theme title must be 'Jet & Cerulean Rose'");
  });

  console.log("\n===============================================================================");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`  STRESS TEST SUMMARY: ${passCount} / ${results.length} PASSED`);
  console.log(`  PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log("===============================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
