"use client";

import Image from "next/image";
import ChatFrame from "./components/chat/chat-frame";
import ChatWindow from "./components/chat/chat-window";
import { ChatProvider } from "./providers/chat-provider";
import { useEffect, useState } from "react";

export default function Home() {
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background: "#1a050b",   // ⭐ Balanced base
      }}
    >
      <style jsx global>{`
        @keyframes floatWild {
          0% { transform: translate(0px, 0px) scale(1); }
          25% { transform: translate(70px, -50px) scale(1.15); }
          50% { transform: translate(-50px, 80px) scale(1.28); }
          75% { transform: translate(30px, 30px) scale(1.12); }
          100% { transform: translate(-75px, -55px) scale(1.22); }
        }

        @keyframes floatWildSlow {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-100px, 65px) scale(1.32); }
          100% { transform: translate(75px, -85px) scale(1.18); }
        }

        @keyframes gradientShift {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(10deg); }
        }
      `}</style>

      {/* ───────── RICH CRIMSON BASE GRADIENT ───────── */}

      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: `
            radial-gradient(circle at 20% 20%, #ff2a55, transparent 38%),
            radial-gradient(circle at 80% 70%, #8b0a28, transparent 42%),
            linear-gradient(160deg, #ff2a55 0%, #4a0616 100%)
          `,
          animation: "gradientShift 20s linear infinite alternate",
        }}
      />

      {/* ───────── FLOATING BLOBS 😈🔥 (BALANCED GLOW) ───────── */}

      <div
        aria-hidden
        style={{
          position: "fixed",
          width: 680,
          height: 680,
          borderRadius: "50%",
          background: "rgba(255, 40, 85, 0.45)",   // ⭐ Deep crimson glow
          filter: "blur(145px)",
          top: "-180px",
          left: "-200px",
          zIndex: 1,
          animation: "floatWild 18s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "fixed",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "rgba(255, 90, 120, 0.32)",  // ⭐ Soft warm highlight
          filter: "blur(135px)",
          bottom: "-140px",
          right: "-150px",
          zIndex: 1,
          animation: "floatWildSlow 24s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "fixed",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "rgba(196, 16, 58, 0.38)",   // ⭐ Brand-rich red
          filter: "blur(125px)",
          top: "35%",
          left: "60%",
          zIndex: 1,
          animation: "floatWild 26s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />

      {/* ───────── CURSOR LIGHT ⭐⭐⭐⭐⭐ ───────── */}

      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `
            radial-gradient(circle at ${mouse.x}% ${mouse.y}%,
              rgba(255, 220, 200, 0.28),
              rgba(255, 60, 100, 0.16),
              transparent 36%)
          `,
          transition: "background 0.08s linear",
          mixBlendMode: "screen",
        }}
      />

      {/* ───────── NOISE + VIGNETTE ───────── */}

      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          opacity: 0.07,
          mixBlendMode: "soft-light",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 4,
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ───────── NAV + MAIN ───────── */}

      <nav
        style={{
          position: "relative",
          zIndex: 20,
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 48px",
          background: "#ffffff",
          boxShadow: "0 6px 22px rgba(0,0,0,0.18)",
        }}
      >
        <Image src="/logo.png" alt="Logo" width={120} height={28} priority />
      </nav>

      <main
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChatProvider languageCode="en">
          <ChatFrame>
            <ChatWindow />
          </ChatFrame>
        </ChatProvider>
      </main>
    </div>
  );
}