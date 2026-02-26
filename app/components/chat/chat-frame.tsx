"use client";

import Image from "next/image";
import { useState } from "react";
import { useChatContext } from "@/app/providers/chat-provider";
import { SocketStatus } from "@/app/hooks/useChat";
import { SessionStatus } from "@/app/hooks/useSession";

function StatusDot({
  socketStatus,
  sessionStatus,
}: {
  socketStatus: SocketStatus;
  sessionStatus: SessionStatus;
}) {
  const [hovered, setHovered] = useState(false);

  const { color, pulse, label } = (() => {
    if (socketStatus === "error" || sessionStatus === "error")
      return { color: "#ef4444", pulse: false, label: "Connection error" };
    if (socketStatus === "disconnected" || sessionStatus === "idle")
      return { color: "#94a3b8", pulse: false, label: "Initialising" };
    if (socketStatus === "connecting" || sessionStatus === "creating")
      return { color: "#f59e0b", pulse: true, label: "Connecting…" };
    if (sessionStatus === "expired")
      return { color: "#f59e0b", pulse: false, label: "Session expired" };
    return { color: "#22c55e", pulse: true, label: "Live · Session active" };
  })();

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%,100% { box-shadow: 0 0 0 0 ${color}55; }
          50%      { box-shadow: 0 0 0 4px ${color}00; }
        }
        .status-tip {
          position: absolute;
          top: calc(100% + 2px);
          right: 0;
          background: #1a1916;
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          padding: 5px 10px;
          border-radius: 7px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 90;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .status-tip::before {
          content: "";
          position: absolute;
          bottom: 100%; right: 4px;
          border: 5px solid transparent;
          border-bottom-color: #1a1916;
        }
      `}</style>
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          cursor: "default",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            animation: pulse ? "dotPulse 2s ease-in-out infinite" : "none",
            transition: "background 0.3s ease",
          }}
        />
        {hovered && <div className="status-tip">{label}</div>}
      </div>
    </>
  );
}

/**
 * A small dot badge that sits on the bottom-right corner of the avatar.
 * Only rendered on small screens (via CSS). Shares the same colour/pulse
 * logic as StatusDot but has no tooltip — it's purely a visual indicator.
 */
function AvatarStatusBadge({
  socketStatus,
  sessionStatus,
}: {
  socketStatus: SocketStatus;
  sessionStatus: SessionStatus;
}) {
  const { color, pulse } = (() => {
    if (socketStatus === "error" || sessionStatus === "error")
      return { color: "#ef4444", pulse: false };
    if (socketStatus === "disconnected" || sessionStatus === "idle")
      return { color: "#94a3b8", pulse: false };
    if (socketStatus === "connecting" || sessionStatus === "creating")
      return { color: "#f59e0b", pulse: true };
    if (sessionStatus === "expired")
      return { color: "#f59e0b", pulse: false };
    return { color: "#22c55e", pulse: true };
  })();

  return (
    <>
      <style>{`
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 0 0 ${color}66; }
          50%      { box-shadow: 0 0 0 3px ${color}00; }
        }
        /* Only visible on small screens */
        .avatar-badge {
          display: none;
        }
        @media (max-width: 480px) {
          .avatar-badge {
            display: block;
          }
        }
      `}</style>
      <div
        className="avatar-badge"
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          border: "2px solid rgba(250,250,249,0.9)",
          animation: pulse ? "badgePulse 2s ease-in-out infinite" : "none",
          transition: "background 0.3s ease",
        }}
      />
    </>
  );
}

function NewChatButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Start a new conversation"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 9,
        border: `1.5px solid ${hovered ? "rgba(196,16,58,0.35)" : "rgba(0,0,0,0.09)"}`,
        background: hovered ? "#fef2f4" : "transparent",
        color: hovered ? "#c4103a" : "#6b6560",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.02em",
        cursor: "pointer",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          flexShrink: 0,
          transition: "transform 0.18s ease",
          transform: hovered ? "rotate(-45deg)" : "none",
        }}
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {/* Hide label on very small screens to save space */}
      <span className="new-chat-label">New chat</span>
    </button>
  );
}

export default function ChatFrame({ children }: { children: React.ReactNode }) {
  const {
    company,
    selectedModality,
    resetSession,
    socketStatus,
    sessionStatus,
    modalities,
  } = useChatContext();

  const botName = company?.css?.botName ?? "Nova";

  const subtitle = (() => {
    if (selectedModality) {
      if (modalities.length === 1) {
        const key = selectedModality.key.toLowerCase();
        if (key === "sales" || key === "purchase") return "AI Sales Copilot";
        if (key === "technical" || key === "support")
          return "AI Support Copilot";
        return `AI ${selectedModality.displayLabel} Copilot`;
      }
      return selectedModality.displayLabel;
    }
    if (modalities.length === 1) return "AI Copilot";
    return null;
  })();

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── Responsive header styles (small screens only) ── */}
      <style>{`
        /* Hide the standalone status dot on small screens — the avatar badge takes over */
        @media (max-width: 480px) {
          .header-status-dot {
            display: none !important;
          }
          /* Subtitle wraps to 2 lines, smaller font so both lines fit the header height */
          .header-subtitle {
            font-size: 10px !important;
            white-space: normal !important;
            line-height: 1.3 !important;
            max-width: 72px;
          }
          /* Bot name stays prominent */
          .header-botname {
            font-size: 15px !important;
            line-height: 1 !important;
          }
          /* Centre-align the name + divider + subtitle as a group */
          .header-name-group {
            align-items: center !important;
            gap: 6px !important;
          }
          /* Hide "New chat" text, keep only the icon */
          .new-chat-label {
            display: none;
          }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 1040,
          maxHeight: 720,
          height: "calc(100vh - 96px)",
          borderRadius: 24,
          padding: 2,
          background: `linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(230,225,218,0.4) 50%, rgba(200,190,180,0.25) 100%)`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)`,
        }}
      >
        <div
          className="w-full flex flex-col overflow-hidden animate-frame-in"
          style={{
            height: "100%",
            borderRadius: 22,
            background: "rgba(250, 250, 249, 0.78)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              height: 64,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              gap: 10,
              background: "rgba(255, 255, 255, 0.72)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid #ece9e4",
            }}
          >
            {/* Avatar — wraps in a relative container so the badge can be positioned */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Image
                src="/nova-icon.svg"
                alt={botName}
                width={36}
                height={36}
                style={{ borderRadius: "50%", display: "block" }}
              />
              {/* Small-screen status badge overlaid on avatar */}
              <AvatarStatusBadge
                socketStatus={socketStatus}
                sessionStatus={sessionStatus}
              />
            </div>

            <div
              className="header-name-group"
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                minWidth: 0,
              }}
            >
              {/* Bot name */}
              <span
                className="header-botname"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1a1916",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {botName}
              </span>

              {subtitle && (
                <>
                  <div
                    style={{
                      width: 1,
                      height: 16,
                      background: "#e5e1db",
                      alignSelf: "center",
                      flexShrink: 0,
                    }}
                  />

                  <span
                    className="header-subtitle"
                    style={{
                      fontSize: 13,
                      color: "#a09b94",
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                      lineHeight: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Live Sales Assistant
                  </span>
                </>
              )}
            </div>

            <div style={{ flex: 1 }} />

            {/* Standalone status dot — hidden on small screens via CSS */}
            <div className="header-status-dot">
              <StatusDot
                socketStatus={socketStatus}
                sessionStatus={sessionStatus}
              />
            </div>

            {selectedModality && (
              <>
                <div
                  style={{
                    width: 1,
                    height: 16,
                    background: "#e5e1db",
                    marginLeft: 6,
                    flexShrink: 0,
                  }}
                />
                <NewChatButton onClick={resetSession} />
              </>
            )}
          </div>

          {/* ── Body ── */}
          <div
            className="flex-1 min-h-0 flex flex-col"
            style={{
              background: "rgba(250, 250, 249, 0.72)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}