"use client";

import { useRef, useState } from "react";
import { transcribeAudio } from "@/app/services/audio/transcribe";
import { MicIcon, StopIcon, XIcon, SendIcon } from "../ui/icons";

type InputState = "idle" | "recording" | "processing" | "has-text";
type RailMode = "idle" | "recording" | "cluster";

const SHELL_H = 130;
const RAIL_W = 56;

export default function ChatInput() {
  const [state, setState] = useState<InputState>("idle");
  const [recTime, setRecTime] = useState(0);
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recTimeRef = useRef<number>(0);

  const [waveHeights] = useState(() =>
    Array.from({ length: 16 }, () => 5 + Math.random() * 14),
  );

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextValue(val);
    if (state === "idle" || state === "has-text") {
      setState(val.trim().length > 0 ? "has-text" : "idle");
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const duration = recTimeRef.current;
        setState("processing");
        stream.getTracks().forEach((t) => t.stop());
        try {
          const text = await transcribeAudio(blob, duration);
          const next = textValue.trim() ? `${textValue.trim()} ${text}` : text;
          setTextValue(next);
          setState(next.trim().length > 0 ? "has-text" : "idle");
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Transcription failed.",
          );
          setState("idle");
        }
      };
      recorder.start();
      setRecTime(0);
      recTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        setRecTime((t) => {
          recTimeRef.current = t + 1;
          return t + 1;
        });
      }, 1000);
      setState("recording");
    } catch {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecTime(0);
    recTimeRef.current = 0;
    setState(textValue.trim().length > 0 ? "has-text" : "idle");
  };

  const clearText = () => {
    setTextValue("");
    setState("idle");
  };

  const shellShadow = (() => {
    const base =
      "0 1px 3px rgba(0,0,0,0.06), 0 3px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.88)";
    if (state === "recording")
      return "0 0 0 1.5px rgba(220,15,65,0.18), 0 3px 16px rgba(220,15,65,0.14), 0 8px 36px rgba(160,8,40,0.10), inset 0 1px 0 rgba(255,255,255,0.75)";
    if (state === "processing")
      return "0 0 0 1.5px rgba(220,15,65,0.10), 0 3px 12px rgba(220,15,65,0.10), inset 0 1px 0 rgba(255,255,255,0.75)";
    if (state === "has-text")
      return "0 0 0 1.5px rgba(22,163,74,0.14), 0 3px 14px rgba(22,163,74,0.10), 0 6px 28px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.88)";
    if (focused)
      return "0 0 0 1.5px rgba(180,140,80,0.18), 0 3px 14px rgba(180,140,80,0.11), 0 6px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.88)";
    return base;
  })();

  const borderColor = (() => {
    if (state === "recording") return "rgba(220,15,65,0.22)";
    if (state === "processing") return "rgba(220,15,65,0.13)";
    if (state === "has-text") return "rgba(22,163,74,0.20)";
    if (focused) return "rgba(180,140,80,0.30)";
    return "rgba(210,203,195,0.85)";
  })();

  const dividerColor = (() => {
    if (state === "recording") return "rgba(220,15,65,0.15)";
    if (state === "has-text") return "rgba(22,163,74,0.15)";
    return "rgba(0,0,0,0.065)";
  })();

  const railMode: RailMode =
    state === "recording"
      ? "recording"
      : state === "has-text" || state === "processing"
        ? "cluster"
        : "idle";

  return (
    <div style={{ width: "100%" }}>
      {error && (
        <div
          style={{
            marginBottom: 10,
            padding: "9px 14px",
            borderRadius: 10,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            animation: "panelFadeIn 0.22s ease",
          }}
        >
          <span style={{ flexShrink: 0 }}>✕</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#dc2626",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          height: SHELL_H,
          borderRadius: 16,
          border: `1.5px solid ${borderColor}`,
          background:
            "linear-gradient(to bottom, #ffffff 0%, #f4f1ee 55%, #eae7e3 100%)",
          boxShadow: shellShadow,
          transition: "box-shadow 0.45s ease, border-color 0.45s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <textarea
            rows={4}
            value={textValue}
            onChange={handleTextChange}
            placeholder="Type your message here..."
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 14,
              lineHeight: 1.78,
              color: "#1a1916",
              fontFamily: "inherit",
              padding: "15px 12px 15px 18px",
              opacity: state === "recording" || state === "processing" ? 0 : 1,
              pointerEvents:
                state === "recording" || state === "processing"
                  ? "none"
                  : "auto",
              transition: "opacity 0.3s ease",
            }}
          />

          {state === "recording" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "20px 12px 16px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 10,
                animation: "panelFadeSlideIn 0.32s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#dc0f41",
                    flexShrink: 0,
                    boxShadow: "0 0 0 2.5px rgba(220,15,65,0.15)",
                    animation: "recDot 1.1s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1a1916",
                    letterSpacing: "0.01em",
                  }}
                >
                  Recording
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  height: 32,
                }}
              >
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2.5,
                      borderRadius: 3,
                      background: "linear-gradient(to top, #c4103a, #ff6b8a)",
                      height: `${h}px`,
                      opacity: 0.75,
                      animation: "wavePulse 1.2s ease-in-out infinite",
                      animationDelay: `${i * 52}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {state === "processing" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "16px 12px 16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                animation: "panelFadeSlideIn 0.28s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  height: 24,
                }}
              >
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2.5,
                      borderRadius: 3,
                      background: "linear-gradient(to top, #dc0f41, #ff4d6d)",
                      animation: "processingBar 0.88s ease-in-out infinite",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: "#a09b94",
                  letterSpacing: "0.01em",
                }}
              >
                Transcribing…
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            width: 1,
            margin: "14px 0",
            flexShrink: 0,
            background: dividerColor,
            transition: "background 0.45s ease",
          }}
        />

        <div
          style={{
            width: RAIL_W,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {railMode === "idle" && (
            <div
              key="idle"
              style={{
                animation: "btnPopIn 0.34s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <button
                onClick={startRecording}
                aria-label="Record"
                className="btn-mic"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  background:
                    "linear-gradient(145deg, #e6134b 0%, #ff3d65 100%)",
                  boxShadow:
                    "0 2px 9px rgba(220,15,65,0.34), 0 1px 3px rgba(0,0,0,0.09)",
                }}
              >
                <MicIcon />
              </button>
            </div>
          )}

          {railMode === "recording" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                animation: "btnPopIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <button
                onClick={stopRecording}
                aria-label="Stop recording"
                className="btn-mic"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  background: "#dc0f41",
                  boxShadow:
                    "0 0 0 2px rgba(220,15,65,0.16), 0 3px 12px rgba(220,15,65,0.38)",
                  animation: "recButtonBreath 2s ease-in-out infinite",
                }}
              >
                <StopIcon />
              </button>

              <div
                style={{
                  animation:
                    "btnFadeUp 0.26s cubic-bezier(0.22,1,0.36,1) 0.06s both",
                }}
              >
                <button
                  onClick={cancelRecording}
                  aria-label="Cancel recording"
                  className="btn-cancel"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(220,15,65,0.08)",
                    color: "#dc0f41",
                  }}
                >
                  <XIcon />
                </button>
              </div>

              <div
                style={{
                  animation:
                    "btnFadeUp 0.24s cubic-bezier(0.22,1,0.36,1) 0.12s both",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color: "#dc0f41",
                    letterSpacing: "0.02em",
                    opacity: 0.8,
                  }}
                >
                  {fmt(recTime)}
                </span>
              </div>
            </div>
          )}

          {railMode === "cluster" && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 6,
                paddingBottom: 10,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingBottom: 8,
                  gap: 8,
                }}
              >
                <div
                  style={{
                    animation:
                      "btnFadeDown 0.28s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <button
                    aria-label="Send"
                    className="btn-send"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "none",
                      cursor:
                        state === "processing" ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(145deg, #22c55e 0%, #16a34a 100%)",
                      color: "white",
                      boxShadow:
                        "0 2px 10px rgba(22,163,74,0.42), 0 1px 3px rgba(0,0,0,0.10)",
                      opacity: state === "processing" ? 0.4 : 1,
                      pointerEvents: state === "processing" ? "none" : "auto",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    <SendIcon />
                  </button>
                </div>
                <div
                  style={{
                    animation:
                      "btnFadeDown 0.26s cubic-bezier(0.22,1,0.36,1) 0.07s both",
                  }}
                >
                  <button
                    onClick={clearText}
                    aria-label="Clear text"
                    className="btn-clear"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "none",
                      cursor:
                        state === "processing" ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.055)",
                      color: "#a09b94",
                      opacity: state === "processing" ? 0.4 : 1,
                      pointerEvents: state === "processing" ? "none" : "auto",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
              </div>

              <div
                style={{
                  animation:
                    "btnPopIn 0.36s cubic-bezier(0.34,1.56,0.64,1) 0.05s both",
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={startRecording}
                  aria-label="Record"
                  className="btn-mic"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    cursor: state === "processing" ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    background:
                      "linear-gradient(145deg, #e6134b 0%, #ff3d65 100%)",
                    boxShadow:
                      "0 2px 9px rgba(220,15,65,0.34), 0 1px 3px rgba(0,0,0,0.09)",
                    opacity: state === "processing" ? 0.4 : 1,
                    pointerEvents: state === "processing" ? "none" : "auto",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  <MicIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        textarea::placeholder { color: #b5afa8; }

        .btn-mic {
          transition: filter 0.15s ease, box-shadow 0.2s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .btn-mic:hover {
          filter: brightness(1.12);
          box-shadow: 0 5px 18px rgba(220,15,65,0.52), 0 2px 6px rgba(0,0,0,0.12) !important;
          transform: scale(1.09) !important;
        }
        .btn-mic:active { transform: scale(0.92) !important; filter: brightness(0.94); }

        .btn-send {
          transition: filter 0.15s ease, box-shadow 0.2s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .btn-send:hover {
          filter: brightness(1.1);
          box-shadow: 0 5px 18px rgba(22,163,74,0.56), 0 2px 5px rgba(0,0,0,0.10) !important;
          transform: scale(1.09) !important;
        }
        .btn-send:active { transform: scale(0.92) !important; }

        .btn-clear {
          transition: background 0.14s ease, color 0.14s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .btn-clear:hover { background: rgba(0,0,0,0.12) !important; color: #555050 !important; transform: scale(1.14) !important; }
        .btn-clear:active { transform: scale(0.88) !important; }

        .btn-cancel {
          transition: background 0.14s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1) !important;
        }
        .btn-cancel:hover { background: rgba(220,15,65,0.16) !important; transform: scale(1.14) !important; }
        .btn-cancel:active { transform: scale(0.88) !important; }

        @keyframes btnPopIn {
          0%   { opacity: 0; transform: scale(0.4); }
          60%  { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes btnFadeDown {
          0%   { opacity: 0; transform: translateY(-12px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes btnFadeUp {
          0%   { opacity: 0; transform: translateY(10px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes panelFadeSlideIn {
          0%   { opacity: 0; transform: translateY(7px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes panelFadeIn {
          0%   { opacity: 0; transform: translateY(-5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes recDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.68); }
        }
        @keyframes wavePulse {
          0%, 100% { transform: scaleY(1); opacity: 0.75; }
          50%       { transform: scaleY(0.32); opacity: 0.38; }
        }
        @keyframes processingBar {
          0%, 100% { height: 4px; opacity: 0.25; }
          50%       { height: 20px; opacity: 1; }
        }
        @keyframes recButtonBreath {
          0%, 100% { box-shadow: 0 0 0 2px rgba(220,15,65,0.16), 0 3px 12px rgba(220,15,65,0.38); }
          50%       { box-shadow: 0 0 0 5px rgba(220,15,65,0.09), 0 5px 20px rgba(220,15,65,0.26); }
        }
      `}</style>
    </div>
  );
}
