"use client";

import Image from "next/image";
import ConnectionStatus from "./connection-status";

interface ChatFrameProps {
  children: React.ReactNode;
}

export default function ChatFrame({ children }: ChatFrameProps) {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Gradient border wrapper */}
      <div
        style={{
          width: "100%",
          maxWidth: 1040,
          maxHeight: 720,
          height: "calc(100vh - 96px)",
          borderRadius: 24,
          padding: 2,
          background: `linear-gradient(160deg,
            rgba(255,255,255,0.55) 0%,
            rgba(230,225,218,0.4) 50%,
            rgba(200,190,180,0.25) 100%
          )`,
          boxShadow: `
            0 32px 80px rgba(0,0,0,0.22),
            0 8px 24px rgba(0,0,0,0.12),
            inset 0 1px 0 rgba(255,255,255,0.9)
          `,
        }}
      >
        <div
          className="w-full flex flex-col overflow-hidden animate-frame-in"
          style={{
            height: "100%",
            borderRadius: 22,
            background: "#fafaf9",
          }}
        >
          {/* ── Nova Header ── */}
          <div
            style={{
              height: 72,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              gap: 12,
              background: "#ffffff",
              borderBottom: "1px solid #ece9e4",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,1), 0 1px 0 #ece9e4",
            }}
          >
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0, width: 46, height: 46 }}>
              <div
                style={{
                  position: "absolute",
                  inset: -1,
                  borderRadius: "50%",
                  background: "#ffffff",
                  zIndex: 1,
                }}
              />
              <Image
                src="/nova-icon.svg"
                alt="Nova"
                width={46}
                height={46}
                style={{
                  borderRadius: "50%",
                  position: "relative",
                  zIndex: 2,
                  display: "block",
                }}
              />
            </div>

            {/* Name + Role */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#1a1916",
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}
              >
                Nova
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: "#ece9e4" }} />

            <span style={{ fontSize: 14, color: "#a09b94", fontWeight: 400 }}>
              Sales Copilot
            </span>

            {/* ── Status indicators — pushed to the right ── */}
            <ConnectionStatus />
          </div>

          {/* ── Chat Body ── */}
          <div
            className="flex-1 min-h-0 flex flex-col"
            style={{ background: "#fafaf9" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}