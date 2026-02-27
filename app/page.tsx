"use client";

import Image from "next/image";
import ChatFrame from "./components/chat/chat-frame";
import ChatWindow from "./components/chat/chat-window";
import { ChatProvider } from "./providers/chat-provider";
import { useEffect, useState, useRef, useCallback } from "react";

interface Triangle {
  points: [number, number][];
  cx: number;
  cy: number;
  baseOpacity: number;
  glowOpacity: number;
}

export default function Home() {
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trianglesRef = useRef<Triangle[]>([]);
  const mouseWorldRef = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mx = mouseWorldRef.current.x;
    const my = mouseWorldRef.current.y;
    const glowRadius = 160;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const tri of trianglesRef.current) {
      const dist = Math.hypot(tri.cx - mx, tri.cy - my);
      const proximity = Math.max(0, 1 - dist / glowRadius);
      const glow = proximity * proximity * 0.35;
      const opacity = tri.baseOpacity + glow;

      ctx.beginPath();
      ctx.moveTo(tri.points[0][0], tri.points[0][1]);
      ctx.lineTo(tri.points[1][0], tri.points[1][1]);
      ctx.lineTo(tri.points[2][0], tri.points[2][1]);
      ctx.closePath();

      ctx.fillStyle = `rgba(220, 140, 150, ${opacity})`;
      ctx.fill();

      ctx.strokeStyle = `rgba(200, 100, 115, ${opacity * 0.9})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  const buildMesh = useCallback((w: number, h: number) => {
    const cols = Math.ceil(w / 130) + 2;
    const rows = Math.ceil(h / 112) + 2;
    const tris: Triangle[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * 130 - 40;
        const y = row * 112 - 35;
        const ox = row % 2 === 0 ? 0 : 65;

        const p1: [number, number] = [x + ox, y];
        const p2: [number, number] = [x + ox + 130, y];
        const p3: [number, number] = [x + ox + 65, y + 112];
        const p4: [number, number] = [x + ox - 65, y + 112];

        const tri1: Triangle = {
          points: [p1, p2, p3],
          cx: (p1[0] + p2[0] + p3[0]) / 3,
          cy: (p1[1] + p2[1] + p3[1]) / 3,
          baseOpacity: Math.random() * 0.06 + 0.08,
          glowOpacity: 0,
        };
        const tri2: Triangle = {
          points: [p1, p3, p4],
          cx: (p1[0] + p3[0] + p4[0]) / 3,
          cy: (p1[1] + p3[1] + p4[1]) / 3,
          baseOpacity: Math.random() * 0.06 + 0.08,
          glowOpacity: 0,
        };
        tris.push(tri1, tri2);
      }
    }
    trianglesRef.current = tris;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildMesh(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [buildMesh, draw]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
      mouseWorldRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const facetSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='76'>
    <defs>
      <linearGradient id='fade' x1='0%' y1='0%' x2='100%' y2='0%'>
        <stop offset='20%' stop-color='white' stop-opacity='0'/>
        <stop offset='100%' stop-color='white' stop-opacity='1'/>
      </linearGradient>
      <mask id='m'>
        <rect width='1200' height='76' fill='url(#fade)'/>
      </mask>
    </defs>
    <g mask='url(#m)'>
      <polygon points='100,0 230,0 165,76'  fill='rgba(110,50,60,0.10)'/>
      <polygon points='100,0 165,76 35,76'  fill='rgba(90,38,48,0.08)'/>
      <polygon points='230,0 360,0 295,76'  fill='rgba(125,60,72,0.11)'/>
      <polygon points='230,0 295,76 165,76' fill='rgba(105,46,56,0.08)'/>
      <polygon points='360,0 490,0 425,76'  fill='rgba(118,55,66,0.12)'/>
      <polygon points='360,0 425,76 295,76' fill='rgba(100,44,54,0.09)'/>
      <polygon points='490,0 620,0 555,76'  fill='rgba(130,62,74,0.11)'/>
      <polygon points='490,0 555,76 425,76' fill='rgba(110,50,60,0.08)'/>
      <polygon points='620,0 750,0 685,76'  fill='rgba(122,58,70,0.12)'/>
      <polygon points='620,0 685,76 555,76' fill='rgba(104,46,56,0.09)'/>
      <polygon points='750,0 880,0 815,76'  fill='rgba(135,65,77,0.13)'/>
      <polygon points='750,0 815,76 685,76' fill='rgba(114,52,63,0.09)'/>
      <polygon points='880,0 1010,0 945,76' fill='rgba(128,60,72,0.12)'/>
      <polygon points='880,0 945,76 815,76' fill='rgba(108,48,58,0.09)'/>
      <polygon points='1010,0 1140,0 1075,76' fill='rgba(138,68,80,0.13)'/>
      <polygon points='1010,0 1075,76 945,76' fill='rgba(116,54,65,0.10)'/>
      <polygon points='1140,0 1200,0 1200,76 1075,76' fill='rgba(142,72,84,0.14)'/>
    </g>
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
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(70px, -50px) scale(1.15);
          }
          50% {
            transform: translate(-50px, 80px) scale(1.28);
          }
          75% {
            transform: translate(30px, 30px) scale(1.12);
          }
          100% {
            transform: translate(-75px, -55px) scale(1.22);
          }
        }
        @keyframes floatWildSlow {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(-100px, 65px) scale(1.32);
          }
          100% {
            transform: translate(75px, -85px) scale(1.18);
          }
        }
        @keyframes gradientShift {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(10deg);
          }
        }
        @keyframes navSlideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .navbar {
          height: 56px;
          padding: 0 20px;
        }
        @media (min-width: 480px) {
          .navbar {
            height: 64px;
            padding: 0 28px;
          }
        }
        @media (min-width: 768px) {
          .navbar {
            height: 76px;
            padding: 0 36px;
          }
        }

        .nav-logo-img {
          width: 100px;
          height: auto;
        }
        @media (min-width: 480px) {
          .nav-logo-img {
            width: 120px;
          }
        }
        @media (min-width: 768px) {
          .nav-logo-img {
            width: 140px;
          }
        }

        .nav-logo-wrap {
          line-height: 0;
          mix-blend-mode: multiply;
          filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.12));
          transition: filter 0.25s ease;
          position: relative;
          z-index: 2;
          isolation: isolate;
        }
        .nav-logo-wrap:hover {
          filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.22));
        }
        .nav-logo-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 1) 70%,
            rgba(255, 255, 255, 0) 100%
          );
          z-index: -1;
          pointer-events: none;
        }

        @media (max-width: 540px) {
          .nav-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Background gradient */}
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

      {/* Floating blobs — repositioned to corners/edges, not center */}
      {/* Top-right blob */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          width: 680,
          height: 680,
          borderRadius: "50%",
          background: "rgba(210,25,60,0.42)",
          filter: "blur(150px)",
          top: "-120px",
          right: "-160px",
          zIndex: 1,
          animation: "floatWild 18s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
      {/* Bottom-left blob */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "rgba(240,70,100,0.26)",
          filter: "blur(140px)",
          bottom: "-100px",
          left: "-120px",
          zIndex: 1,
          animation: "floatWildSlow 24s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
      {/* Mid-right smaller blob */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "rgba(170,10,40,0.32)",
          filter: "blur(130px)",
          top: "30%",
          right: "5%",
          zIndex: 1,
          animation: "floatWild 26s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />

      {/* Cursor highlight */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(255,190,170,0.2), rgba(255,45,85,0.1), transparent 34%)`,
          transition: "background 0.08s linear",
          mixBlendMode: "screen",
        }}
      />

      {/* Grain */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 4,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          opacity: 0.055,
          mixBlendMode: "soft-light",
        }}
      />

      {/* Triangle mesh canvas — above vignette so it's not suppressed */}
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 6,
          pointerEvents: "none",
          mixBlendMode: "normal",
          opacity: 0.55,
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 60%, transparent 32%, rgba(0,0,0,0.68) 100%)",
        }}
      />

      {/* NAVBAR */}
      <nav
        className="navbar"
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          background: `
            ${facetURL},
            linear-gradient(105deg,
              rgba(255, 255, 255, 1)   0%,
              rgba(255, 255, 255, 1)  30%,
              rgba(248, 242, 243, 0.96) 45%,
              rgba(235, 220, 222, 0.93) 58%,
              rgba(218, 198, 201, 0.90) 70%,
              rgba(198, 172, 176, 0.88) 82%,
              rgba(178, 148, 153, 0.86) 91%,
              rgba(160, 125, 130, 0.84) 100%)
          `,
          backgroundSize: "100% 100%, 100%",
          backdropFilter: "blur(40px) saturate(160%) brightness(1.02)",
          WebkitBackdropFilter: "blur(40px) saturate(160%) brightness(1.02)",
          borderBottom: "1px solid rgba(160, 125, 130, 0.5)",
          boxShadow: `
            inset 0 1px 0 rgba(255, 255, 255, 1),
            0 1px 0 rgba(150, 110, 115, 0.3),
            0 8px 32px rgba(0, 0, 0, 0.18)
          `,
          animation: "navSlideDown 0.55s cubic-bezier(0.22,1,0.36,1) forwards",
        }}
      >
        <div
          className="nav-inner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            position: "relative",
          }}
        >
          <div className="nav-logo-wrap">
            <Image
              src="/msxi-logo.png"
              alt="MSX International"
              width={110}
              height={18}
              priority
              className="nav-logo-img"
              style={{ display: "block", width: undefined, height: "auto" }}
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
