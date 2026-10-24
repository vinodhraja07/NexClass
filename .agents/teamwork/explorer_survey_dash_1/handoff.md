# Architectural Survey Report & Handoff: Dashboard Left-Sidebar Navigation & Shell

**Author**: Explorer 1 (`explorer_survey_dash_1`)  
**Date**: 2026-10-24  
**Working Directory**: `E:\mnt\e\NexClass\.agents\teamwork\explorer_survey_dash_1`  
**Target Milestone**: NexClass Dashboard Transformation (Follow-up 2026-10-24T03:28:45Z)  
**Primary Scope**: Web app navigation, shell, routing architecture, responsive rail/drawer design, URL query synchronization, and server health footer.

---

## 1. Observation

### 1.1 Current Routing & Layout Shell in `apps/web/src/App.tsx`
- **File**: `apps/web/src/App.tsx` (lines 51–74)
- **Direct Code Evidence**:
  ```tsx
  51: <Routes location={location}>
  52:   <Route path="/" element={<Landing />} />
  53:   <Route path="/login" element={<Login />} />
  54:   <Route path="/register" element={<Register />} />
  55:   <Route path="/join" element={<JoinMeeting />} />
  56:   <Route path="/demo" element={<DemoIndex />} />
  57:   <Route path="/demo/captions" element={<Demo />} />
  58:   <Route path="/demo/room" element={<DemoRoom />} />
  59:   <Route
  60:     path="/dashboard"
  61:     element={
  62:       <RequireAuth>
  63:         <Dashboard />
  64:       </RequireAuth>
  65:     }
  66:   />
  67:   <Route path="/meet/:code" element={<Classroom />} />
  68:   <Route path="*" element={<Navigate to="/" replace />} />
  74: </Routes>
  ```
- **Animation Container Behavior**:
  In `apps/web/src/App.tsx` (lines 44–50):
  ```tsx
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
  >
  ```
  `motion.div` strictly keys on `location.pathname` (`/dashboard`). It does **not** key on `location.search` (`?view=...`). Consequently, updating URL search query parameters does **not** unmount or re-animate the outer application shell in `App.tsx`.

### 1.2 Current Tab Switching in `apps/web/src/pages/Dashboard.tsx`
- **File**: `apps/web/src/pages/Dashboard.tsx` (lines 50, 69–100, 420–522)
- **Current Tab State & Query Param**:
  ```tsx
  50: type DashboardTab = "classrooms" | "create" | "transcripts";
  ...
  69: const tabParam = searchParams.get("tab") as DashboardTab | null;
  70: const [activeTab, setActiveTabState] = useState<DashboardTab>(
  71:   tabParam && ["classrooms", "create", "transcripts"].includes(tabParam)
  72:     ? tabParam
  73:     : "classrooms",
  74: );
  76: const setActiveTab = useCallback(
  77:   (tab: DashboardTab) => {
  78:     setActiveTabState(tab);
  79:     setSearchParams(
  80:       (prev) => {
  81:         const next = new URLSearchParams(prev);
  82:         if (tab === "classrooms") {
  83:           next.delete("tab");
  84:         } else {
  85:           next.set("tab", tab);
  86:         }
  87:         return next;
  88:       },
  89:       { replace: true },
  90:     );
  91:   },
  92:   [setSearchParams],
  93: );
  ```
- **Current UI Header Structure**:
  Currently, `Dashboard.tsx` stacks **two separate horizontal headers**:
  1. **Top Header** (lines 420–463): `h-[60px] sticky top-0 z-30` containing Brand logo (`Sparkles`), `Badge` ("Teacher"/"Student"), time greeting ("Good morning, Vinodh"), "Try Demo", "New Meeting", and "Sign out".
  2. **Sub-Navigation Tabs Bar** (lines 466–522): `h-[48px] sticky top-[57px] z-20` containing horizontal tab buttons: "My Classrooms" (active count pill), "Create Classroom" (plus icon), and "Transcripts & History" (recent count badge).
  3. **Main Content Container** (lines 525–1213): `<main className="relative flex-1 mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-8 sm:py-8">` with 3 conditional panels.
  4. **Footer** (lines 1216–1218): Static 1-line copyright text at the bottom.

### 1.3 Provider & Infrastructure Status Data Source
- **File**: `apps/web/src/components/dashboard/ProviderStatusBar.tsx` (lines 6–26, 45–120) & `apps/web/src/lib/api.ts` (lines 176–190)
- **Data Model**:
  ```tsx
  export interface ProviderStatusData {
    providers: {
      category: string; // 'turn' (WebRTC/STUN relay), 'tts' (Neural TTS), 'asr', 'translation'
      configured: boolean;
      provider: string; // e.g. "Coturn relay", "Neural Indic TTS"
      detail: string;
      envVars: string[];
    }[];
    languages: LanguageCode[];
    terminology: { total: number; approved: number; needsReview: number; draft: number };
    infrastructure: {
      mongodb: { connected: boolean; fallback: boolean };
      redis: { connected: boolean };
    };
    demoMode: boolean;
  }
  ```
- **Observation**: `api.providerStatus()` is already invoked in `Dashboard.tsx` (lines 148–150), but its full potential is under-utilized in the dashboard shell.

### 1.4 User Profile & Avatar Assets
- **File**: `apps/web/src/components/classroom/Avatar.tsx` (lines 5–31, 48–100)
- `Avatar` supports gradient palettes (`AVATAR_PALETTES`), deterministic initials hashing, animated glowing border ring, and sizes `xs`, `sm`, `md`, `lg`, `xl`.
- `useAuth()` in `apps/web/src/lib/auth.tsx` provides `user` (`id`, `name`, `email`, `role`, `preferredLanguage`), `logout()`, and `updateLanguage()`.

### 1.5 Theme Engine & Preferences
- **File**: `apps/web/src/themes/ThemeProvider.tsx` and `themes.css`
- Supports 4 built-in luxury dark themes:
  1. `midnight-purple` (Signature default: `#12111E`, `#262338`, `#8980BD`)
  2. `earth-sand` (`#1A1714`, `#302820`, `#C9A17A`)
  3. `forest-moderne` (`#101A16`, `#1D3028`, `#78A98B`)
  4. `ocean-blue` (`#0B1724`, `#192B3A`, `#438EAC`)
- Accessible via `const { theme, setTheme, allThemes } = useTheme();`.

### 1.6 Current Build and Test State
- Command `npm --prefix E:\mnt\e\NexClass run typecheck`: **0 errors** across `@nexclass/api` and `@nexclass/web`.
- Command `npm --prefix E:\mnt\e\NexClass run build -w @nexclass/web`: **Clean build in 3.68s** (all 2031 modules compiled).
- Command `npm --prefix E:\mnt\e\NexClass test`: **All 5 test suites (64 tests) passed 100%**.

---

## 2. Logic Chain

### 2.1 Why Replace Top Tabs with a Left Sidebar
1. **Vertical Real Estate Reclamation**: The current stacked 2-tier top navigation (`header` + `nav` = ~115px) consumes critical vertical height on laptops and standard displays, forcing unnecessary scrolling.
2. **Cognitive Load Reduction**: A left-sidebar navigation layout (similar to Linear and Slack) groups workspace identity, primary navigation, user profile, and system status into a single cohesive rail, providing generous whitespace and clear orientation.
3. **Extensibility**: The new requirements specify a 4th section (`Preferences & Languages`). Accommodating 4 tabs horizontally across mobile and tablet breaks easily, whereas a vertical sidebar naturally accommodates growing navigation categories.

### 2.2 Routing Strategy: Query Parameter Synchronization vs Sub-routes
1. **Observation**: R1 & Acceptance Criteria explicitly state:
   *"Active view seamlessly updates without full page reloads and synchronizes with URL search params (`?view=classrooms|create|transcripts`)."*
2. **Analysis**:
   - If we used nested route paths (`/dashboard/create`), any navigation might trigger unneeded route matches and requires updating `App.tsx` routes.
   - Using query parameter synchronization (`/dashboard?view=classrooms|create|transcripts|preferences`) keeps the dashboard route `/dashboard` stable in `App.tsx`.
   - `searchParams.get("view")` with `setSearchParams(next, { replace: true })` uses HTML5 `history.replaceState` without triggering a full page reload or unmounting the outer `Dashboard` component.
   - For backwards compatibility: If a user bookmarks or visits `/dashboard?tab=transcripts`, we fall back to `searchParams.get("view") ?? searchParams.get("tab")`.

### 2.3 Responsive Rail & Slide-Over Drawer Architecture
1. **Desktop Viewport (`>= 1024px`, `lg`)**:
   - Sidebar is a fixed left rail (`fixed left-0 top-0 bottom-0 z-30`).
   - Supports two states:
     - **Expanded Mode (`w-64` / 256px)**: Full brand wordmark, role indicator, labeled navigation items with badges, active profile card, and system status subtitle.
     - **Collapsed Mode (`w-20` / 80px)**: Icon-only rail. Labels collapse into sleek floating glass tooltips (`absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-ink-850/95 border border-ink-600/80 backdrop-blur-xl shadow-xl text-xs z-50`).
   - Toggle state is stored in `localStorage` (`nexclass_sidebar_collapsed`).
   - Main content offset smoothly transitions using `lg:ml-64` vs `lg:ml-20`.
2. **Mobile & Tablet Viewport (`< 1024px`)**:
   - Sidebar rail is hidden on small screens (`hidden lg:flex`).
   - A slim, non-intrusive mobile header bar (`h-14 lg:hidden sticky top-0 z-30`) provides a hamburger menu button (`Menu` icon, 44x44px touch target) and compact brand mark.
   - Clicking hamburger triggers a smooth slide-over drawer:
     - Backdrop: `motion.div` with `bg-ink-950/80 backdrop-blur-md` (z-40).
     - Drawer Panel: `motion.aside` sliding from `x: "-100%"` to `0` with spring physics (`stiffness: 350, damping: 32`) (z-50).
     - Dismissal: Clicking backdrop, clicking close (`X`), selecting any navigation item, or pressing `Escape` key (`keydown` event listener).
     - Body scroll locking (`document.body.style.overflow = "hidden"` while open).

### 2.4 Footer Section: Live Infrastructure & Sign Out
1. **Live WebRTC / STUN / Neural TTS Status**:
   - From `api.providerStatus()`:
     - WebRTC / Network relay: `providers.find(p => p.category === 'turn')`
     - Neural TTS: `providers.find(p => p.category === 'tts')`
     - Translation: `providers.find(p => p.category === 'translation')`
     - Infrastructure: `mongodb.connected`, `redis.connected`
   - In Sidebar footer:
     - An ambient status beacon with a glowing green pulse dot (`LiveDot` or `bg-emerald-400`).
     - Clicking opens a dark glass popover (`SystemStatusModal`) with granular status breakdown for teachers/admins without taking up permanent vertical space.
2. **Logout Action**:
   - Tactile button with `LogOut` icon.
   - Invokes `useAuth().logout()` followed by `navigate("/login", { replace: true })`.

---

## 3. Caveats

1. **Monolithic `Dashboard.tsx` Refactoring**:
   `apps/web/src/pages/Dashboard.tsx` is currently 1,222 lines with forms and lists inlined. The navigation transformation should decompose this cleanly by introducing `DashboardSidebar.tsx` and modular view components without breaking any existing meeting creation, join, or transcript export handlers.
2. **Strict View Sync Naming**:
   The existing code used query parameter `?tab=classrooms|create|transcripts`. The new requirement specifies `?view=classrooms|create|transcripts`. The implementation MUST support `view` as primary and clean up legacy `tab` to prevent URL param collision.
3. **Accessibility & Reduced Motion**:
   When `useReducedMotion()` is active, all sidebar drawer slides and rail width transitions must fall back to instant transitions with 0s duration to prevent motion sickness.
4. **Offline / Unreachable API State**:
   If the API server is offline, the status beacon in the sidebar footer should reflect a warning/error state (`bg-signal-warn` or `bg-signal-live`) and allow a 1-click retry.

---

## 4. Conclusion & Proposed Architecture

### 4.1 Component Blueprint & File Paths

| File Path | Action | Responsibilities |
|---|---|---|
| `apps/web/src/components/dashboard/DashboardSidebar.tsx` | **Create** | Left sidebar navigation layout: brand identity, role badge, user profile card, 4 nav items (`classrooms`, `create`, `transcripts`, `preferences`), real-time counters, responsive rail collapse, mobile drawer, footer status beacon, and logout trigger. |
| `apps/web/src/components/dashboard/DashboardMobileHeader.tsx` | **Create** | Sticky mobile header bar (<1024px) with hamburger toggle, brand wordmark, role badge, and user avatar. |
| `apps/web/src/components/dashboard/SystemStatusModal.tsx` | **Create** | Dark glass popover displaying live WebRTC, STUN, Neural TTS, and MongoDB/Redis connection statuses. |
| `apps/web/src/components/dashboard/views/PreferencesView.tsx` | **Create** | Focused view for `?view=preferences`: UI language selector, caption presets, voice auto-play toggle, and 4-theme luxury switcher (`useTheme()`). |
| `apps/web/src/pages/Dashboard.tsx` | **Modify** | Replace top 2-tier header with `DashboardSidebar` and `DashboardMobileHeader`. Update view switching to `?view=classrooms|create|transcripts|preferences`. Retain all existing state (`hosted`, `joined`, `provider`, `loadMeetings`, `handleCreate`, `handleInstantCreate`, etc.). |
| `apps/web/src/App.tsx` | **Verify (No change needed)** | Keep `/dashboard` route mapped to `<RequireAuth><Dashboard /></RequireAuth>`. URL search params flow naturally. |

### 4.2 Detailed Interfaces & Props Specification

```tsx
// ============================================================================
// Navigation View Types
// ============================================================================
export type DashboardView = "classrooms" | "create" | "transcripts" | "preferences";

// ============================================================================
// DashboardSidebar Props
// ============================================================================
export interface DashboardSidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  user: UserPublic;
  isTeacher: boolean;
  activeCount: number;      // Upcoming / live meetings count
  historyCount: number;     // Recent meetings count
  providerStatus: ProviderStatusData | null;
  providerLoading?: boolean;
  providerError?: string | null;
  onRefreshProvider?: () => void;
  onSignOut: () => void;
  onInstantCreate?: () => void;
  isCreatingInstant?: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

// ============================================================================
// Navigation Item Definition
// ============================================================================
export interface NavItemConfig {
  id: DashboardView;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  badge?: number | string | null;
  badgeTone?: "accent" | "neutral" | "live";
  teacherOnly?: boolean;
  isQuickAction?: boolean;
}
```

### 4.3 Nav Item Configuration Structure

```tsx
export const DASHBOARD_NAV_ITEMS: NavItemConfig[] = [
  {
    id: "classrooms",
    label: "Classrooms",
    icon: LayoutGrid,
    badgeTone: "accent",
  },
  {
    id: "create",
    label: "Create Classroom",
    icon: PlusCircle,
    teacherOnly: true,
    isQuickAction: true,
  },
  {
    id: "transcripts",
    label: "Transcripts & Archive",
    icon: FileText,
    badgeTone: "neutral",
  },
  {
    id: "preferences",
    label: "Preferences & Languages",
    icon: Languages,
  },
];
```

### 4.4 URL Query Synchronization Implementation Snippet

```tsx
// Inside apps/web/src/pages/Dashboard.tsx:
const [searchParams, setSearchParams] = useSearchParams();

const rawView = searchParams.get("view") ?? searchParams.get("tab");
const activeView: DashboardView = useMemo(() => {
  if (rawView === "create" || rawView === "transcripts" || rawView === "preferences") {
    return rawView;
  }
  return "classrooms";
}, [rawView]);

const handleViewChange = useCallback(
  (nextView: DashboardView) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", nextView);
        next.delete("tab"); // Clean up legacy param
        return next;
      },
      { replace: true },
    );
  },
  [setSearchParams],
);
```

### 4.5 Responsive Rail Layout Shell in `Dashboard.tsx`

```tsx
<div className="relative min-h-screen bg-ink-900 overflow-hidden text-ivory-100 flex">
  {/* Ambient Breathing Background Glow Orbs */}
  <div className="pointer-events-none fixed inset-0 bg-mesh-dark opacity-60" aria-hidden="true" />
  
  {/* Left Sidebar Navigation (Desktop permanent rail + Mobile slide-over drawer) */}
  <DashboardSidebar
    activeView={activeView}
    onViewChange={handleViewChange}
    user={user}
    isTeacher={isTeacher}
    activeCount={upcoming.length}
    historyCount={allRecent.length}
    providerStatus={provider}
    providerLoading={providerLoading}
    providerError={providerError}
    onRefreshProvider={loadProvider}
    onSignOut={handleSignOut}
    onInstantCreate={handleInstantCreate}
    isCreatingInstant={creatingInstant}
    collapsed={sidebarCollapsed}
    onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
    mobileOpen={mobileDrawerOpen}
    onCloseMobile={() => setMobileDrawerOpen(false)}
  />

  {/* Main Dashboard Area */}
  <div className={clsx(
    "flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-[0.2,0.8,0.2,1]",
    sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
  )}>
    {/* Mobile Top Header (<1024px) */}
    <DashboardMobileHeader
      onOpenMobile={() => setMobileDrawerOpen(true)}
      user={user}
      isTeacher={isTeacher}
      activeView={activeView}
    />

    {/* Focused View Container with Motion Transition */}
    <main className="relative flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
          transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {activeView === "classrooms" && <ClassroomsView ... />}
          {activeView === "create" && <CreateClassroomView ... />}
          {activeView === "transcripts" && <TranscriptsView ... />}
          {activeView === "preferences" && <PreferencesView ... />}
        </motion.div>
      </AnimatePresence>
    </main>
  </div>
</div>
```

---

## 5. Verification Method

### 5.1 Independent Verification Commands
To verify compliance and stability:
1. **TypeScript Hygiene**:
   ```powershell
   npm --prefix E:\mnt\e\NexClass run typecheck
   ```
   *Expected outcome*: 0 errors across `@nexclass/api` and `@nexclass/web`.
2. **Vite Production Compilation**:
   ```powershell
   npm --prefix E:\mnt\e\NexClass run build -w @nexclass/web
   ```
   *Expected outcome*: Vite compiles cleanly with all CSS and JS chunks emitted to `dist/`.
3. **Vitest Unit & Integration Suites**:
   ```powershell
   npm --prefix E:\mnt\e\NexClass test
   ```
   *Expected outcome*: All 64 test cases in `@nexclass/api` pass 100%.

### 5.2 Browser & Layout Verification Checklist
- [ ] Desktop View (`>= 1024px`): Left sidebar is permanently docked. Clicking the collapse button smoothly contracts the rail from `w-64` to `w-20` (icon-only mode) with floating tooltips.
- [ ] Mobile/Tablet View (`< 1024px`): Top mobile header appears with hamburger menu. Clicking hamburger slides out the drawer with a dark blurred backdrop (`backdrop-blur-md`).
- [ ] Dismissal: Pressing `Escape` or clicking the backdrop closes the mobile drawer immediately. Selecting any nav item closes the drawer and updates the view.
- [ ] Query Param Sync: Clicking between navigation items updates URL search params to `?view=classrooms`, `?view=create`, `?view=transcripts`, `?view=preferences` with zero full-page reload. Navigating back/forward in browser history transitions views seamlessly.
- [ ] System Health & Logout: Footer shows live status beacon for WebRTC / STUN / Neural TTS. Clicking Sign Out logs the user out and redirects to `/login`.
