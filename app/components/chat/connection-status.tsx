"use client";

import { useChatContext } from "@/app/providers/chat-provider";
import { SessionStatus } from "@/app/hooks/useSession";
import { SocketStatus } from "@/app/hooks/useChat";

// ── Dot indicator ──────────────────────────────────────────────────────────────
function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        boxShadow: pulse ? `0 0 0 3px ${color}28` : undefined,
        animation: pulse ? "pulseDot 1.6s ease-in-out infinite" : undefined,
      }}
    />
  );
}

// ── Maps ───────────────────────────────────────────────────────────────────────
function sessionAppearance(s: SessionStatus): {
  color: string;
  label: string;
  pulse?: boolean;
} {
  switch (s) {
    case "idle":
      return { color: "#a09b94", label: "Not started" };
    case "creating":
      return { color: "#f59e0b", label: "Opening session…", pulse: true };
    case "active":
      return { color: "#22c55e", label: "Session active", pulse: true };
    case "expired":
      return { color: "#f59e0b", label: "Session expired" };
    case "error":
      return { color: "#ef4444", label: "Session error" };
  }
}

function socketAppearance(s: SocketStatus): {
  color: string;
  label: string;
  pulse?: boolean;
} {
  switch (s) {
    case "disconnected":
      return { color: "#a09b94", label: "Offline" };
    case "connecting":
      return { color: "#f59e0b", label: "Connecting…", pulse: true };
    case "connected":
      return { color: "#22c55e", label: "Live", pulse: true };
    case "error":
      return { color: "#ef4444", label: "Connection error" };
  }
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ConnectionStatus() {
  const { sessionStatus, sessionError, socketStatus, retrySession, resetSession } =
    useChatContext();

  const sess = sessionAppearance(sessionStatus);
  const sock = socketAppearance(socketStatus);

  const showRetryBtn =
    sessionStatus === "error" || sessionStatus === "expired";

  return (
    <>
      {/* Keyframe injection — rendered once in the DOM */}
      <style>{`
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.6; transform:scale(.8); }
        }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginLeft: "auto",
          animation: "slideDown 0.3s ease",
        }}
      >
        {/* ── Socket pill ── */}
        <Pill
          dot={<StatusDot color={sock.color} pulse={sock.pulse} />}
          label={sock.label}
          muted={socketStatus === "disconnected"}
        />

        {/* ── Session pill ── */}
        <Pill
          dot={<StatusDot color={sess.color} pulse={sess.pulse} />}
          label={sess.label}
          muted={sessionStatus === "idle"}
        />

        {/* ── Retry / Reset buttons ── */}
        {showRetryBtn && (
          <button
            onClick={retrySession}
            title="Retry session"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid #ef444440",
              background: "#fef2f2",
              color: "#ef4444",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.03em",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#fee2e2";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#fef2f2";
            }}
          >
            <RetryIcon />
            Retry
          </button>
        )}

        {/* Error tooltip if message present */}
        {sessionError && sessionStatus === "error" && (
          <span
            title={sessionError}
            style={{
              fontSize: 10,
              color: "#ef4444",
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              opacity: 0.8,
            }}
          >
            {sessionError}
          </span>
        )}
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Pill({
  dot,
  label,
  muted,
}: {
  dot: React.ReactNode;
  label: string;
  muted: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 20,
        background: muted ? "#f3f2f0" : "rgba(0,0,0,0.04)",
        border: "1px solid",
        borderColor: muted ? "#ece9e4" : "rgba(0,0,0,0.07)",
        fontSize: 11,
        fontWeight: 500,
        color: muted ? "#b0a9a1" : "#4a4540",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        transition: "all 0.3s ease",
      }}
    >
      {dot}
      {label}
    </span>
  );
}

function RetryIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}