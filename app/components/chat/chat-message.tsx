"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = "bot" | "user";

export interface BaseMessage {
  id: string;
  role: MessageRole;
  timestamp: Date;
  status?: "sending" | "delivered" | "read";
}

export interface TextMessage extends BaseMessage {
  kind: "text";
  content: string;
}

export interface VoiceMessage extends BaseMessage {
  kind: "voice";
  audioURL: string;
  durationSecs: number;
  transcript?: string;
}

// Bot messages can optionally stream audio in future
export interface BotMessage extends BaseMessage {
  role: "bot";
  kind: "text";
  content: string;
  /** Pass a function that returns a readable stream for future TTS streaming */
  getAudioStream?: () => Promise<ReadableStream<Uint8Array>>;
}

export type ChatMessageType = TextMessage | VoiceMessage | BotMessage;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlayIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
    <path d="M0 0L10 6L0 12V0Z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
    <rect x="0" y="0" width="3.5" height="12" rx="1" />
    <rect x="6.5" y="0" width="3.5" height="12" rx="1" />
  </svg>
);
const CopyIcon = ({ copied }: { copied: boolean }) =>
  copied ? (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5,7 5,10.5 11.5,2.5" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1.5" />
      <path d="M9 4V2.5A1.5 1.5 0 007.5 1h-6A1.5 1.5 0 000 2.5v6A1.5 1.5 0 001.5 10H3" />
    </svg>
  );

const SpeakerIcon = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4.5H4.5L7.5 2V11L4.5 8.5H2V4.5Z" fill={active ? "currentColor" : "none"} />
    {active ? (
      <>
        <path d="M9.5 3.5C10.8 4.5 10.8 8.5 9.5 9.5" />
        <path d="M11 1.5C13.5 3.5 13.5 9.5 11 11.5" />
      </>
    ) : (
      <path d="M9.5 3.5C10.8 4.5 10.8 8.5 9.5 9.5" />
    )}
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="10" height="10" viewBox="0 0 10 10" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}
  >
    <polyline points="1,3 5,7 9,3" />
  </svg>
);

const BotAvatar = () => (
  <div style={{
    width: 32, height: 32, borderRadius: "50%",
    background: "var(--avatar-bot)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: 14,
  }}>
    🔧
  </div>
);

const UserAvatar = () => (
  <div style={{
    width: 32, height: 32, borderRadius: "50%",
    background: "var(--avatar-user)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: 14,
  }}>
    👤
  </div>
);

// ─── Waveform bar component ────────────────────────────────────────────────────

const WAVE_COUNT = 28;

function Waveform({
  progress,
  heights,
  accentColor,
  mutedColor,
  onClick,
  duration,
}: {
  progress: number;
  heights: number[];
  accentColor: string;
  mutedColor: string;
  onClick?: (pct: number) => void;
  duration: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current || !onClick) return;
    const rect = ref.current.getBoundingClientRect();
    onClick((e.clientX - rect.left) / rect.width);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      style={{
        display: "flex", alignItems: "center", gap: 2,
        height: 24, cursor: onClick ? "pointer" : "default", flex: 1,
      }}
    >
      {heights.map((h, i) => {
        const pct = i / heights.length;
        const played = pct < progress;
        return (
          <div
            key={i}
            style={{
              flex: 1, borderRadius: 2,
              height: `${h}px`,
              backgroundColor: played ? accentColor : mutedColor,
              opacity: played ? 0.95 : 0.4,
              transition: "background-color 80ms, opacity 80ms",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Voice Message Player (shared logic for user + potentially bot) ────────────

function AudioPlayer({
  audioURL,
  duration,
  heights,
  accentColor,
  mutedColor,
  timerColor,
}: {
  audioURL: string;
  duration: number;
  heights: number[];
  accentColor: string;
  mutedColor: string;
  timerColor: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setIsPlaying(true); }
    else { el.pause(); setIsPlaying(false); }
  };

  const seek = (pct: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = pct * el.duration;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <audio
        ref={audioRef}
        src={audioURL}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el || !el.duration) return;
          setProgress(el.currentTime / el.duration);
          setCurrentTime(el.currentTime);
        }}
        onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }}
      />

      <button
        onClick={toggle}
        style={{
          width: 30, height: 30, borderRadius: "50%",
          background: accentColor, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", flexShrink: 0,
          boxShadow: `0 2px 8px ${accentColor}55`,
        }}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <Waveform
        progress={progress}
        heights={heights}
        accentColor={accentColor}
        mutedColor={mutedColor}
        onClick={seek}
        duration={duration}
      />

      <span style={{
        fontSize: 11.5, fontVariantNumeric: "tabular-nums",
        color: timerColor, flexShrink: 0, minWidth: 28,
      }}>
        {fmt(progress > 0 ? currentTime : duration)}
      </span>
    </div>
  );
}

// ─── User Voice Message ────────────────────────────────────────────────────────

function UserVoiceMessage({ msg, heights }: { msg: VoiceMessage; heights: number[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasTranscript = !!msg.transcript?.trim();
  const TRUNCATE = 90;
  const isLong = (msg.transcript?.length ?? 0) > TRUNCATE;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280 }}>
      {/* Audio pill */}
      <div style={{
        background: "var(--bubble-user)",
        borderRadius: "18px 18px 4px 18px",
        padding: "10px 14px",
      }}>
        <AudioPlayer
          audioURL={msg.audioURL}
          duration={msg.durationSecs}
          heights={heights}
          accentColor="var(--accent-light)"
          mutedColor="rgba(255,255,255,0.5)"
          timerColor="rgba(255,255,255,0.75)"
        />
      </div>

      {/* Transcript */}
      {hasTranscript && (
        <div style={{
          background: "var(--bubble-user-transcript)",
          borderRadius: "4px 18px 18px 18px",
          padding: "8px 12px",
          position: "relative",
        }}>
          <p style={{
            fontSize: 12,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.5,
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: expanded ? undefined : 2,
            WebkitBoxOrient: "vertical",
          }}>
            &ldquo;{msg.transcript}&rdquo;
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                marginTop: 4,
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.5)", fontSize: 11, padding: 0,
              }}
            >
              {expanded ? "Collapse" : "Show full transcript"}
              <ChevronIcon open={expanded} />
            </button>
          )}
        </div>
      )}

      <MessageMeta role="user" msg={msg} />
    </div>
  );
}

// ─── User Text Message ─────────────────────────────────────────────────────────

function UserTextMessage({ msg }: { msg: TextMessage }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 320 }}>
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          background: "var(--bubble-user)",
          borderRadius: "18px 18px 4px 18px",
          padding: "10px 14px",
          color: "#fff",
          fontSize: 13.5,
          lineHeight: 1.55,
          wordBreak: "break-word",
        }}>
          {msg.content}
        </div>

        {/* Copy button — appears on hover */}
        <button
          onClick={copy}
          title="Copy message"
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            right: 4,
            background: "var(--bg-action)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "4px 8px",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            color: copied ? "var(--green)" : "var(--txt-secondary)",
            fontSize: 11,
            opacity: hovered || copied ? 1 : 0,
            transform: hovered || copied ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 150ms ease, transform 150ms ease, color 150ms ease",
            pointerEvents: hovered ? "auto" : "none",
            whiteSpace: "nowrap",
          }}
        >
          <CopyIcon copied={copied} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <MessageMeta role="user" msg={msg} />
    </div>
  );
}

// ─── Bot Message ───────────────────────────────────────────────────────────────

function BotTextMessage({ msg }: { msg: BotMessage }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  // Prepare for future audio streaming — check if getAudioStream is provided
  useEffect(() => {
    if (msg.getAudioStream) setStreamReady(true);
  }, [msg.getAudioStream]);

  const handlePlay = async () => {
    if (!msg.getAudioStream || isStreaming) return;
    setIsStreaming(true);
    try {
      // Future: pipe stream to Web Audio API
      // const stream = await msg.getAudioStream();
      // const reader = stream.getReader();
      // … decode and play chunks …
      console.log("[TTS] Stream playback not yet implemented — hook is ready.");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 340 }}>
      <div style={{
        background: "var(--bubble-bot)",
        border: "1px solid var(--border)",
        borderRadius: "18px 18px 18px 4px",
        padding: "11px 14px",
        color: "var(--txt-primary)",
        fontSize: 13.5,
        lineHeight: 1.6,
        wordBreak: "break-word",
        position: "relative",
      }}>
        {msg.content}

        {/* TTS play button — shown only if getAudioStream is wired up */}
        {streamReady && (
          <button
            onClick={handlePlay}
            disabled={isStreaming}
            title="Listen to this message"
            style={{
              position: "absolute",
              top: 8, right: 8,
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "3px 7px",
              cursor: isStreaming ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
              color: isStreaming ? "var(--accent)" : "var(--txt-muted)",
              fontSize: 10.5,
              transition: "color 150ms, border-color 150ms",
            }}
          >
            <SpeakerIcon active={isStreaming} />
            {isStreaming ? "Playing…" : "Listen"}
          </button>
        )}
      </div>

      <MessageMeta role="bot" msg={msg} />
    </div>
  );
}

// ─── Message Meta (timestamp + status) ────────────────────────────────────────

function MessageMeta({ role, msg }: { role: MessageRole; msg: BaseMessage }) {
  const statusIcon =
    msg.status === "delivered" ? "✓✓" :
    msg.status === "read"      ? "✓✓" :
    msg.status === "sending"   ? "○"  : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      justifyContent: role === "user" ? "flex-end" : "flex-start",
      paddingRight: role === "user" ? 4 : 0,
      paddingLeft: role === "bot" ? 4 : 0,
    }}>
      <span style={{ fontSize: 10.5, color: "var(--txt-muted)" }}>
        {fmtTime(msg.timestamp)}
      </span>
      {role === "user" && statusIcon && (
        <span style={{
          fontSize: 10.5,
          color: msg.status === "read" ? "var(--accent)" : "var(--txt-muted)",
          letterSpacing: -1,
        }}>
          {statusIcon}
        </span>
      )}
    </div>
  );
}

// ─── Main ChatMessage component ───────────────────────────────────────────────

// Stable per-message waveform heights
const messageWaveCache = new Map<string, number[]>();
const getWaveHeights = (id: string) => {
  if (!messageWaveCache.has(id)) {
    messageWaveCache.set(
      id,
      Array.from({ length: WAVE_COUNT }, () => 3 + Math.random() * 17)
    );
  }
  return messageWaveCache.get(id)!;
};

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  const heights = getWaveHeights(message.id);

  return (
    <>
      <style>{`
        .chat-message-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          animation: msgIn 200ms ease both;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div
        className="chat-message-row"
        style={{ flexDirection: isUser ? "row-reverse" : "row" }}
      >
        {/* Avatar */}
        {isUser ? <UserAvatar /> : <BotAvatar />}

        {/* Bubble */}
        {message.role === "bot" ? (
          <BotTextMessage msg={message as BotMessage} />
        ) : message.kind === "voice" ? (
          <UserVoiceMessage msg={message as VoiceMessage} heights={heights} />
        ) : (
          <UserTextMessage msg={message as TextMessage} />
        )}
      </div>
    </>
  );
}

// ─── Demo / Preview ───────────────────────────────────────────────────────────

const DEMO_MESSAGES: ChatMessageType[] = [
  {
    id: "1", role: "bot", kind: "text",
    content: "Hello! I'm your support assistant. How can I help you today? 👋",
    timestamp: new Date(Date.now() - 5 * 60000),
    status: "read",
  } as BotMessage,
  {
    id: "2", role: "user", kind: "voice",
    audioURL: "",
    durationSecs: 8,
    transcript: "Where can I get self-repair and technical information? Where can I purchase replacement parts?",
    timestamp: new Date(Date.now() - 4 * 60000),
    status: "delivered",
  } as VoiceMessage,
  {
    id: "3", role: "bot", kind: "text",
    content: "Thank you for your message. I'm analysing your request and will assist you shortly.\nIs there anything specific you'd like help with?",
    timestamp: new Date(Date.now() - 3 * 60000),
    // Uncomment to show the Listen button:
    // getAudioStream: async () => new ReadableStream(),
  } as BotMessage,
  {
    id: "4", role: "user", kind: "text",
    content: "How do I find my Ford's service history? … How do I add a vehicle to my account?",
    timestamp: new Date(Date.now() - 2 * 60000),
    status: "delivered",
  } as TextMessage,
  {
    id: "5", role: "user", kind: "voice",
    audioURL: "",
    durationSecs: 14,
    transcript: "I also wanted to ask about the warranty status on my 2019 Ford Mustang. My VIN is 1FA6P8TH5K5100001. Can you check if it's still under warranty and what's covered?",
    timestamp: new Date(Date.now() - 60000),
    status: "read",
  } as VoiceMessage,
];

export default function ChatMessageDemo() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --bg:                  #0f0f14;
          --bg-action:           #1c1c24;
          --bubble-bot:          #1a1a24;
          --bubble-user:         #6c47e8;
          --bubble-user-transcript: #4f33b0;
          --accent:              #6c47e8;
          --accent-light:        #a78bfa;
          --green:               #34d399;
          --border:              rgba(255,255,255,0.09);
          --txt-primary:         rgba(255,255,255,0.92);
          --txt-secondary:       rgba(255,255,255,0.55);
          --txt-muted:           rgba(255,255,255,0.32);
          --avatar-bot:          #1f1f2e;
          --avatar-user:         #2d1f6e;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--txt-primary);
          min-height: 100vh;
        }
      `}</style>

      <div style={{
        maxWidth: 520, margin: "0 auto",
        padding: "32px 20px",
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--txt-muted)", textAlign: "center" }}>
          Chat Message Component Preview
        </p>

        {DEMO_MESSAGES.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Show bot with TTS hook wired */}
        <ChatMessage message={{
          id: "tts-demo", role: "bot", kind: "text",
          content: "This message has a future TTS hook attached. The Listen button will appear once your audio stream API is ready.",
          timestamp: new Date(),
          getAudioStream: async () => new ReadableStream(),
        } as BotMessage} />
      </div>
    </>
  );
}