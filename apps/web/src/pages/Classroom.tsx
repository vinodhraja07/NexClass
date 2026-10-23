import { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { LiveDot } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { readGuestSession } from "@/components/dashboard/guestSession";
import { SocketTransport } from "@/lib/socketTransport";
import { ClassroomShell } from "@/components/classroom/ClassroomShell";
import type { LanguageCode } from "@nexclass/shared";

export default function Classroom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const guest = useMemo(() => (code ? readGuestSession(code) : null), [code]);

  // The transport is created once per meeting: dropping it disconnects the
  // socket, so it lives outside re-renders. Guests authenticate with the
  // per-meeting participant token stored with their join session.
  const transport = useMemo(() => {
    if (!code) return null;
    return new SocketTransport({ meetingCode: code, token: guest?.token });
  }, [code, guest]);

  useEffect(() => () => window.scrollTo(0, 0), []);

  if (!code) return <Navigate to="/join" replace />;
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-ink-900 text-ivory-400">
        <div className="flex items-center gap-2.5 text-sm">
          <LiveDot />
          Checking your session…
        </div>
      </div>
    );
  }
  if (!user && !guest) return <Navigate to={`/join?code=${encodeURIComponent(code)}`} replace />;

  if (!transport) return null;

  return (
    <div className="h-full bg-ink-900">
      <ClassroomShell
        transport={transport}
        meetingCode={code.toUpperCase()}
        name={user ? user.name : guest?.name}
        language={(user ? user.preferredLanguage : guest?.language) as LanguageCode}
        onLeft={() => navigate(user ? "/dashboard" : "/join?joined=left")}
      />
    </div>
  );
}
