"use client";

import { useEffect, useState } from "react";
import { useChatContext } from "@/app/providers/chat-provider";
import type { ResolvedModality } from "@/app/types/company";

function LoadingSkeleton() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -500px 0; }
          100% { background-position:  500px 0; }
        }
        .sk {
          background: linear-gradient(90deg, #f0ede9 25%, #e8e4df 50%, #f0ede9 75%);
          background-size: 1000px 100%;
          animation: shimmer 1.6s infinite linear;
          border-radius: 6px;
        }
      `}</style>
      <div className="sk" style={{ width: 240, height: 24, borderRadius: 8 }} />
      <div className="sk" style={{ width: 180, height: 13 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        {[0, 1].map((i) => (
          <div key={i} className="sk" style={{ width: 148, height: 52, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 40px", textAlign: "center" }}>
      <p style={{ fontSize: 13, color: "#a09b94", margin: 0 }}>
        Couldn&apos;t load configuration
        {error && <><br /><span style={{ fontFamily: "monospace", fontSize: 11 }}>{error}</span></>}
      </p>
      <button onClick={onRetry} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "#1a1916", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        Retry
      </button>
    </div>
  );
}

function ModalityCard({ modality, onSelect, disabled, index }: {
  modality: ResolvedModality;
  onSelect: () => void;
  disabled: boolean;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  const hint =
    modality.key === "technical" || modality.key === "support" ? "Technical assistance" :
    modality.key === "sales"     || modality.key === "purchase" ? "Pricing & products"  :
    "Get started";

  return (
    <>
      <style>{`
        @keyframes cardRise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <button
        onClick={onSelect}
        disabled={disabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 5,
          padding: "15px 20px 14px",
          borderRadius: 13,
          border: `1.5px solid ${hovered ? "rgba(196,16,58,0.28)" : "rgba(0,0,0,0.07)"}`,
          background: hovered ? "linear-gradient(140deg,#fff9fa 0%,#fff 100%)" : "#ffffff",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          minWidth: 148,
          opacity: disabled ? 0.5 : 1,
          boxShadow: hovered
            ? "0 6px 22px rgba(196,16,58,0.09), 0 1px 4px rgba(0,0,0,0.05)"
            : "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
          transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
          transform: hovered && !disabled ? "translateY(-2px)" : "translateY(0)",
          animation: `cardRise 0.3s ease ${index * 0.07 + 0.12}s both`,
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 2,
          background: hovered ? "linear-gradient(90deg, #c4103a 0%, #ff6b8a 100%)" : "transparent",
          transition: "background 0.22s ease",
        }} />

        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: hovered ? "#c4103a" : "#1a1916",
          letterSpacing: "0.005em",
          transition: "color 0.18s",
        }}>
          {modality.displayLabel}
        </span>

        <span style={{
          fontSize: 11,
          color: "#b5afa8",
          fontWeight: 400,
          letterSpacing: "0.02em",
        }}>
          {hint}
        </span>
      </button>
    </>
  );
}

export default function ModalityPicker() {
  const {
    company,
    companyStatus,
    companyError,
    retryCompany,
    modalities,
    selectModality,
    sessionStatus,
  } = useChatContext();

  useEffect(() => {
    if (companyStatus === "ready" && modalities.length === 1) {
      selectModality(modalities[0]);
    }
  }, [companyStatus, modalities, selectModality]);

  const isStarting = sessionStatus === "creating";

  if (companyStatus === "loading" || companyStatus === "idle") return <LoadingSkeleton />;
  if (companyStatus === "error") return <ErrorState error={companyError} onRetry={retryCompany} />;
  if (modalities.length === 1) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SpinnerMini />
      </div>
    );
  }

  const botName   = company?.css?.botName ?? "Assistant";
  const introMsgs = company?.bot_intro_message?.en ?? [];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        gap: 0,
      }}>

        {/* Greeting block */}
        <div style={{
          textAlign: "center",
          maxWidth: 400,
          animation: "fadeUp 0.32s ease both",
        }}>
          {/* Bot name — muted label above the headline */}
          <p style={{
            margin: "0 0 10px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#b5afa8",
          }}>
            {botName}
          </p>

          {/* Primary intro line */}
          <h2 style={{
            margin: "0 0 10px",
            fontSize: 21,
            fontWeight: 700,
            color: "#1a1916",
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
          }}>
            {introMsgs[0] ?? `Hello, I'm ${botName}`}
          </h2>

          {/* Remaining intro lines */}
          {introMsgs.slice(1).map((msg, i) => (
            <p key={i} style={{
              margin: "0 0 3px",
              fontSize: 13,
              color: "#7a7470",
              lineHeight: 1.65,
              fontWeight: 400,
              animation: `fadeUp 0.28s ease ${(i + 1) * 0.07 + 0.06}s both`,
            }}>
              {msg}
            </p>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          width: "100%",
          maxWidth: 360,
          margin: "28px 0 22px",
          animation: "fadeUp 0.28s ease 0.2s both",
        }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #ddd9d3)" }} />
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "#c4bdb5",
            whiteSpace: "nowrap",
          }}>
            What's on your mind?
          </span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #ddd9d3, transparent)" }} />
        </div>

        {/* Modality cards */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {modalities.map((m, i) => (
            <ModalityCard
              key={m.key}
              modality={m}
              onSelect={() => selectModality(m)}
              disabled={isStarting}
              index={i}
            />
          ))}
        </div>

        {isStarting && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 20, animation: "fadeUp 0.2s ease both" }}>
            <SpinnerMini />
            <span style={{ fontSize: 11, color: "#b5afa8", letterSpacing: "0.04em" }}>Starting session…</span>
          </div>
        )}
      </div>
    </>
  );
}

function SpinnerMini() {
  return (
    <>
      <style>{`@keyframes spinMini { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 14, height: 14, borderRadius: "50%",
        border: "2px solid #ece9e4", borderTopColor: "#c4103a",
        animation: "spinMini 0.7s linear infinite", flexShrink: 0,
      }} />
    </>
  );
}