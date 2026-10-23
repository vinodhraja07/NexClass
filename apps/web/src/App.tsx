import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "./lib/auth";
import { HiddenEasterEggs } from "./components/easter-eggs/HiddenEasterEggs";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const JoinMeeting = lazy(() => import("./pages/JoinMeeting"));
const Classroom = lazy(() => import("./pages/Classroom"));
const Demo = lazy(() => import("./pages/Demo"));
const DemoIndex = lazy(() => import("./pages/DemoIndex"));
const DemoRoom = lazy(() => import("./pages/DemoRoom"));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900">
      <div className="flex items-center gap-3 text-ivory-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" />
        <span className="text-sm tracking-wide">Loading NexClass…</span>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <HiddenEasterEggs />
      <AnimatePresence mode="wait">
      <Suspense fallback={<PageFallback />}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/join" element={<JoinMeeting />} />
            <Route path="/demo" element={<DemoIndex />} />
            <Route path="/demo/captions" element={<Demo />} />
            <Route path="/demo/room" element={<DemoRoom />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/meet/:code"
              element={
                <Classroom />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </Suspense>
    </AnimatePresence>
    </>
  );
}
