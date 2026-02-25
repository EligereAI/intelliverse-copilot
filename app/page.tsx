import Image from "next/image";
import ChatFrame from "./components/chat/chat-frame";
import ChatWindow from "./components/chat/chat-window";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background: "#6b0a1f",
      }}
    >
      {/* ── Layer 1: Rich multi-stop gradient ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: `linear-gradient(160deg,
          #ff2a55 0%,
          #c4103a 25%,
          #8b0a28 55%,
          #4a0616 100%
        )`,
        }}
      />

      {/* ── Layer 2: Large radial bloom — top-left light source ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background: `radial-gradient(ellipse 80% 70% at 15% 5%,
          rgba(255, 120, 120, 0.45) 0%,
          rgba(255, 40, 70, 0.15) 40%,
          transparent 70%
        )`,
        }}
      />

      {/* ── Layer 3: Bottom-right deep shadow ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          background: `radial-gradient(ellipse 60% 50% at 95% 100%,
          rgba(30, 0, 8, 0.7) 0%,
          transparent 65%
        )`,
        }}
      />

      {/* ── Layer 4: Diagonal light sweep ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          background: `linear-gradient(105deg,
          rgba(255, 200, 180, 0.07) 0%,
          transparent 40%,
          rgba(60, 0, 15, 0.25) 100%
        )`,
        }}
      />

      {/* ── Layer 5: Noise grain ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 4,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "220px 220px",
          opacity: 0.055,
          mixBlendMode: "soft-light",
        }}
      />

      {/* ── Layer 6: Vignette ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5,
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 45%, rgba(20,0,6,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Nav ── */}
      <nav
        style={{
          position: "relative",
          zIndex: 20,
          height: 64,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 48px",
          background: "#ffffff",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/*
          mix-blend-mode: multiply eliminates the white background on the PNG.
          White pixels (255,255,255) multiplied against the white nav = white nav.
          The actual logo content (dark pixels) stays visible.
        */}
        <Image
          src="/logo.png"
          alt="Logo"
          width={120}
          height={28}
          priority
          style={{
            height: 52,
            width: "auto",
            objectFit: "contain",
            mixBlendMode: "multiply",
          }}
        />
      </nav>

      {/* ── Main ── */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* Gradient border wrapper — top highlight, bottom bleeds red */}
        <div
          style={{
            width: "100%",
            maxWidth: 1040,
            borderRadius: 24,
            padding: 3,
            background: `linear-gradient(160deg,
            rgba(255,255,255,0.35) 0%,
            rgba(255,255,255,0.08) 40%,
            rgba(180,20,50,0.4) 100%
          )`,
            boxShadow: `
            0 0 0 1px rgba(0,0,0,0.15),
            0 30px 80px rgba(0,0,0,0.45),
            0 10px 30px rgba(0,0,0,0.3),
            0 60px 120px rgba(100,0,20,0.35),
            inset 0 1px 0 rgba(255,255,255,0.25)
          `,
          }}
        >
          <div style={{ borderRadius: 22, overflow: "hidden" }}>
            <ChatFrame>
              <ChatWindow />
            </ChatFrame>
          </div>
        </div>
      </main>
    </div>
  );
}
