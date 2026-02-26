"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import ChatInput from "./chat-input";
import ChatMessage from "./chat-message";
import ContactFormModal from "./contact-support-modal";
import ModalityPicker from "./modality-picker";
import { useChatContext } from "@/app/providers/chat-provider";

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%,60%,100%{transform:translateY(0);opacity:.4}
          30%{transform:translateY(-5px);opacity:1}
        }
        @keyframes typingIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ display:"flex", flexDirection:"row", alignItems:"flex-end", gap:8, padding:"2px 0", animation:"typingIn .18s ease both" }}>
        <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.12)" }}>
          <Image src="/nova-icon.svg" alt="Bot" width={28} height={28} style={{ display:"block" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"12px 16px", borderRadius:"16px 16px 16px 4px", background:"#ffffff", boxShadow:"0 1px 4px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.05)" }}>
          {[0,1,2].map((i) => (
            <span key={i} style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#c4bdb5", animation:`typingBounce 1.2s ease-in-out ${i*.18}s infinite` }} />
          ))}
        </div>
      </div>
    </>
  );
}

// ── Welcome bubbles ───────────────────────────────────────────────────────────
function WelcomeBubbles({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <>
      <style>{`@keyframes welcomeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        return (
          <div key={i} style={{ display:"flex", flexDirection:"row", alignItems:"flex-end", gap:8, padding:"2px 0", animation:`welcomeIn .24s ease ${i*.1}s both` }}>
            {isLast ? (
              <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.12)" }}>
                <Image src="/nova-icon.svg" alt="Bot" width={28} height={28} style={{ display:"block" }} />
              </div>
            ) : (
              <div style={{ width:28, flexShrink:0 }} />
            )}
            <div style={{ maxWidth:"68%", padding:"11px 15px", borderRadius:"16px 16px 16px 4px", background:"#ffffff", color:"#1a1916", fontSize:14, lineHeight:1.6, boxShadow:"0 1px 4px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.05)", wordBreak:"break-word", whiteSpace:"pre-wrap" }}>
              {msg}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Session gate screens ──────────────────────────────────────────────────────
function SessionError({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, padding:"0 40px", textAlign:"center" }}>
      <p style={{ fontSize:14, fontWeight:600, color:"#1a1916", margin:0 }}>Couldn&apos;t start session</p>
      {error && <p style={{ fontSize:12, color:"#a09b94", margin:0, fontFamily:"monospace" }}>{error}</p>}
      <button onClick={onRetry} style={{ padding:"8px 20px", borderRadius:10, border:"none", background:"#1a1916", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>Try again</button>
    </div>
  );
}
function SessionExpired({ onReset }: { onReset: () => void }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, padding:"0 40px", textAlign:"center" }}>
      <p style={{ fontSize:14, fontWeight:600, color:"#1a1916", margin:0 }}>Session expired</p>
      <p style={{ fontSize:12, color:"#a09b94", margin:0 }}>Start a new conversation to continue.</p>
      <button onClick={onReset} style={{ padding:"8px 20px", borderRadius:10, border:"none", background:"#1a1916", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>New session</button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChatWindow() {
  const {
    messages, isWaiting, sendMessage, sendFeedback,
    selectedModality, sessionStatus, sessionError,
    retrySession, resetSession, socketStatus,
  } = useChatContext();

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showContact, setShowContact] = useState(false);

  // Track whether user has scrolled up manually — if so, don't force-scroll
  const userScrolledUp = useRef(false);
  const isStreaming = messages.some((m) => m.isStreaming);

  // Detect manual scroll-up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      const atBottom = el!.scrollHeight - el!.scrollTop - el!.clientHeight < 80;
      userScrolledUp.current = !atBottom;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to bottom helper — instant during streaming, smooth otherwise
  function scrollToBottom(smooth = true) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }

  // On new message added (length change) — always scroll, reset userScrolledUp
  useLayoutEffect(() => {
    userScrolledUp.current = false;
    scrollToBottom(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // During streaming — scroll every render tick unless user scrolled up
  useLayoutEffect(() => {
    if (isStreaming && !userScrolledUp.current) {
      scrollToBottom(false);
    }
  });

  // On isWaiting change (typing indicator appears/disappears)
  useEffect(() => {
    if (!userScrolledUp.current) scrollToBottom(true);
  }, [isWaiting]);

  if (!selectedModality) {
    return <div style={{ display:"flex", flexDirection:"column", height:"100%" }}><ModalityPicker /></div>;
  }
  if (sessionStatus === "creating" || sessionStatus === "idle") {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"16px 16px 8px" }}>
          <TypingIndicator />
        </div>
        <div style={{ flexShrink:0, padding:"10px 14px 14px" }}>
          <ChatInput onSend={() => {}} disabled={true} />
        </div>
      </div>
    );
  }
  if (sessionStatus === "error") {
    return <div style={{ display:"flex", flexDirection:"column", height:"100%" }}><SessionError error={sessionError} onRetry={retrySession} /></div>;
  }
  if (sessionStatus === "expired") {
    return <div style={{ display:"flex", flexDirection:"column", height:"100%" }}><SessionExpired onReset={resetSession} /></div>;
  }

  const canSend = socketStatus === "connected" && !isWaiting;
  const welcomeMessages = selectedModality.bot_welcome_message?.en ?? [];
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID ?? "";

  const showAvatars = messages.map((msg, i) => {
    const next = messages[i + 1];
    return !next || next.sender !== msg.sender;
  });

  return (
    <>
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        {/* ── Message list ── */}
        <div
          ref={scrollRef}
          style={{
            flex:1, minHeight:0, overflowY:"auto",
            padding:"16px 16px 8px",
            display:"flex", flexDirection:"column",
            gap:2,
            scrollbarWidth:"thin",
            scrollbarColor:"#ddd9d3 transparent",
          }}
        >
          <WelcomeBubbles messages={welcomeMessages} />

          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              showAvatar={showAvatars[i]}
              hasNewerMessage={i < messages.length - 1}
              onPromptbackClick={sendMessage}
              onFeedback={sendFeedback}
              onContactSupport={() => setShowContact(true)}
              onHeightChange={() => { if (!userScrolledUp.current) scrollToBottom(false); }}
            />
          ))}

          {isWaiting && !messages.some((m) => m.isStreaming) && <TypingIndicator />}
          <div ref={bottomRef} style={{ height:1 }} />
        </div>

        {/* ── Input ── */}
        <div style={{ flexShrink:0, padding:"10px 14px 14px" }}>
          <ChatInput onSend={sendMessage} disabled={!canSend} />
        </div>
      </div>

      {/* ── Contact form modal ── */}
      {showContact && (
        <ContactFormModal
          companyId={companyId}
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  );
}