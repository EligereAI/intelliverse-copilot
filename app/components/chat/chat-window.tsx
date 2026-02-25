"use client";

import { useEffect, useRef } from "react";

import ChatInput from "./chat-input";
import ChatMessage from "./chat-message";
import { useChatContext } from "@/app/providers/chat-provider";

// ── Session gate overlays ──────────────────────────────────────────────────────
function SessionCreating() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        color: "#a09b94",
      }}
    >
      <SpinnerRing />
      <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.02em" }}>
        Opening session…
      </span>
    </div>
  );
}

function SessionError({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "0 40px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        ⚡
      </div>
      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1a1916",
            margin: 0,
            marginBottom: 4,
          }}
        >
          Couldn&apos;t start session
        </p>
        {error && (
          <p
            style={{
              fontSize: 12,
              color: "#a09b94",
              margin: 0,
              fontFamily: "monospace",
            }}
          >
            {error}
          </p>
        )}
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: "8px 20px",
          borderRadius: 10,
          border: "none",
          background: "#1a1916",
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "0.02em",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.8")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
      >
        Try again
      </button>
    </div>
  );
}

function SessionExpired({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "0 40px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#fffbeb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        🕐
      </div>
      <div>
        <p
          style={{ fontSize: 14, fontWeight: 600, color: "#1a1916", margin: 0, marginBottom: 4 }}
        >
          Session expired
        </p>
        <p style={{ fontSize: 12, color: "#a09b94", margin: 0 }}>
          Start a new conversation to continue.
        </p>
      </div>
      <button
        onClick={onReset}
        style={{
          padding: "8px 20px",
          borderRadius: 10,
          border: "none",
          background: "#1a1916",
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.8")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
      >
        New session
      </button>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%,80%,100% { transform: translateY(0); opacity:.4; }
          40%          { transform: translateY(-5px); opacity:1; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "12px 16px",
          alignSelf: "flex-start",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#c4bdb5",
              animation: `typingBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: 0.45,
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      <span style={{ fontSize: 32 }}>💬</span>
      <span style={{ fontSize: 13, color: "#6b6560", fontWeight: 500 }}>
        Send a message to get started
      </span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ChatWindow() {
  const {
    messages,
    isWaiting,
    sendMessage,
    sessionStatus,
    sessionError,
    retrySession,
    resetSession,
    socketStatus,
  } = useChatContext();

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWaiting]);

  // ── Session gate ───────────────────────────────────────────────────────────
  if (sessionStatus === "creating" || sessionStatus === "idle") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <SessionCreating />
      </div>
    );
  }

  if (sessionStatus === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <SessionError error={sessionError} onRetry={retrySession} />
      </div>
    );
  }

  if (sessionStatus === "expired") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <SessionExpired onReset={resetSession} />
      </div>
    );
  }

  // ── Active session ─────────────────────────────────────────────────────────
  const canSend = socketStatus === "connected" && !isWaiting;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Message list */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "20px 20px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          scrollbarWidth: "thin",
          scrollbarColor: "#ddd9d3 transparent",
        }}
      >
        {messages.length === 0 && !isWaiting ? (
          <EmptyState />
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {/* Typing indicator — show when waiting but no streaming message exists yet */}
        {isWaiting && !messages.some((m) => m.isStreaming) && (
          <TypingIndicator />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          flexShrink: 0,
          padding: "12px 14px 14px",
          background: "transparent",
        }}
      >
        <ChatInput onSend={sendMessage} disabled={!canSend} />
      </div>
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function SpinnerRing() {
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid #ece9e4",
          borderTopColor: "#c4103a",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </>
  );
}