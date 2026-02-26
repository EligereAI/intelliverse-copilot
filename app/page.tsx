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

  // Sparse, large polygon accents — Apple-style, not cluttered
  const facetSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='68'>
    <polygon points='0,0 120,0 60,68'     fill='rgba(255,255,255,0.035)'/>
    <polygon points='90,0 240,0 165,68'   fill='rgba(255,255,255,0.025)'/>
    <polygon points='200,0 360,0 280,68'  fill='rgba(255,255,255,0.03)'/>
    <polygon points='300,68 360,0 360,68' fill='rgba(255,255,255,0.02)'/>
  </svg>`;
  const facetURL = `url("data:image/svg+xml,${encodeURIComponent(facetSVG)}")`;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background: "#0d0305",
      }}
    >
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600&display=swap");

        @keyframes floatWild {
          0%   { transform: translate(0px, 0px) scale(1); }
          25%  { transform: translate(70px, -50px) scale(1.15); }
          50%  { transform: translate(-50px, 80px) scale(1.28); }
          75%  { transform: translate(30px, 30px) scale(1.12); }
          100% { transform: translate(-75px, -55px) scale(1.22); }
        }
        @keyframes floatWildSlow {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(-100px, 65px) scale(1.32); }
          100% { transform: translate(75px, -85px) scale(1.18); }
        }
        @keyframes gradientShift {
          0%   { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(10deg); }
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nav-logo-wrap {
          line-height: 0;
          mix-blend-mode: lighten;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.4))
                  drop-shadow(0 0 22px rgba(255,200,200,0.15));
          transition: filter 0.25s ease;
        }
        .nav-logo-wrap:hover {
          filter: drop-shadow(0 0 14px rgba(255,255,255,0.6))
                  drop-shadow(0 0 32px rgba(255,160,160,0.25));
        }

        @media (max-width: 540px) {
          .nav-inner { justify-content: center !important; }
        }
      `}</style>

      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: `
            radial-gradient(circle at 18% 18%, #d8102e, transparent 36%),
            radial-gradient(circle at 82% 72%, #6e0618, transparent 40%),
            linear-gradient(155deg, #b8102a 0%, #350310 55%, #0d0305 100%)
          `,
          animation: "gradientShift 20s linear infinite alternate",
        }}
      />

      <div aria-hidden style={{ position:"fixed", width:680, height:680, borderRadius:"50%", background:"rgba(210,25,60,0.42)", filter:"blur(150px)", top:"-180px", left:"-200px", zIndex:1, animation:"floatWild 18s ease-in-out infinite", mixBlendMode:"screen" }} />
      <div aria-hidden style={{ position:"fixed", width:600, height:600, borderRadius:"50%", background:"rgba(240,70,100,0.26)", filter:"blur(140px)", bottom:"-140px", right:"-150px", zIndex:1, animation:"floatWildSlow 24s ease-in-out infinite", mixBlendMode:"screen" }} />
      <div aria-hidden style={{ position:"fixed", width:520, height:520, borderRadius:"50%", background:"rgba(170,10,40,0.32)", filter:"blur(130px)", top:"35%", left:"58%", zIndex:1, animation:"floatWild 26s ease-in-out infinite", mixBlendMode:"screen" }} />

      {/* Cursor highlight */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
          background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(255,190,170,0.2), rgba(255,45,85,0.1), transparent 34%)`,
          transition: "background 0.08s linear",
          mixBlendMode: "screen",
        }}
      />

      {/* Grain */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px", opacity: 0.055, mixBlendMode: "soft-light",
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, zIndex: 4, pointerEvents: "none",
          background: "radial-gradient(circle at 50% 60%, transparent 32%, rgba(0,0,0,0.68) 100%)",
        }}
      />

      {/* NAVBAR */}
      <nav
        style={{
          position: "relative",
          zIndex: 20,
          height: 68,
          display: "flex",
          alignItems: "center",
          padding: "0 36px",
          // Dark charcoal glass — complementary to the red body below
          background: `
            ${facetURL},
            linear-gradient(180deg,
              rgba(80, 18, 28, 0.72) 0%,
              rgba(50, 10, 18, 0.68) 100%)
          `,
          backgroundSize: "360px 68px, 100%",
          backdropFilter: "blur(40px) saturate(170%) brightness(1.05)",
          WebkitBackdropFilter: "blur(40px) saturate(170%) brightness(1.05)",
          // Subtle warm-rose bottom border — ties to body color without being loud
          borderBottom: "1px solid rgba(200, 60, 80, 0.18)",
          boxShadow: `
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            0 1px 0 rgba(200, 40, 60, 0.12),
            0 8px 32px rgba(0, 0, 0, 0.55)
          `,
          animation: "navSlideDown 0.55s cubic-bezier(0.22,1,0.36,1) forwards",
        }}
      >
        <div
          className="nav-inner"
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", position:"relative" }}
        >
          <div className="nav-logo-wrap">
            <Image
              src="/msxi_logo.png"
              alt="MSX International"
              width={110}
              height={18}
              priority
              style={{ display: "block" }}
            />
          </div>
        </div>
      </nav>

      {/* MAIN */}
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