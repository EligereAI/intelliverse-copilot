"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import ChatInput from "./chat-input";
import ChatMessage from "./chat-message";
import ModalityPicker from "./modality-picker";
import { useChatContext } from "@/app/providers/chat-provider";

// Typing indicator
function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%,60%,100% { transform:translateY(0);    opacity:0.4; }
          30%          { transform:translateY(-5px); opacity:1;   }
        }
        @keyframes typingIn {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
      <div style={{
        display:"flex", flexDirection:"row", alignItems:"flex-end",
        gap:8, padding:"2px 0",
        animation:"typingIn 0.18s ease both",
      }}>
        <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.12)" }}>
          <Image src="/nova-icon.svg" alt="Bot" width={28} height={28} style={{ display:"block" }} />
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          padding:"12px 16px",
          borderRadius:"16px 16px 16px 4px",
          background:"#ffffff",
          boxShadow:"0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
        }}>
          {[0,1,2].map((i) => (
            <span key={i} style={{
              display:"inline-block", width:7, height:7, borderRadius:"50%",
              background:"#c4bdb5",
              animation:`typingBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </>
  );
}

// Welcome bubbles
function WelcomeBubbles({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <>
      <style>{`
        @keyframes welcomeIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        return (
          <div key={i} style={{
            display:"flex", flexDirection:"row", alignItems:"flex-end",
            gap:8, padding:"2px 0",
            animation:`welcomeIn 0.24s ease ${i * 0.1}s both`,
          }}>
            {isLast ? (
              <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.12)" }}>
                <Image src="/nova-icon.svg" alt="Bot" width={28} height={28} style={{ display:"block" }} />
              </div>
            ) : (
              <div style={{ width:28, flexShrink:0 }} />
            )}
            <div style={{
              maxWidth:"68%", padding:"11px 15px",
              borderRadius:"16px 16px 16px 4px",
              background:"#ffffff", color:"#1a1916",
              fontSize:14, lineHeight:1.6,
              boxShadow:"0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
              wordBreak:"break-word", whiteSpace:"pre-wrap",
            }}>
              {msg}
            </div>
          </div>
        );
      })}
    </>
  );
}

// Session gate screens
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

// Main
export default function ChatWindow() {
  const {
    messages, isWaiting, sendMessage,
    selectedModality, sessionStatus, sessionError,
    retrySession, resetSession, socketStatus,
  } = useChatContext();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWaiting]);

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

  // Avatar grouping: show avatar only on last consecutive message per sender
  const showAvatars = messages.map((msg, i) => {
    const next = messages[i + 1];
    return !next || next.sender !== msg.sender;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* ── Message list ── */}
      <div style={{
        flex:1, minHeight:0, overflowY:"auto",
        padding:"16px 16px 8px",
        display:"flex", flexDirection:"column",
        gap:2,
        scrollbarWidth:"thin",
        scrollbarColor:"#ddd9d3 transparent",
      }}>
        <WelcomeBubbles messages={welcomeMessages} />

        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            showAvatar={showAvatars[i]}
            hasNewerMessage={i < messages.length - 1}
            onPromptbackClick={sendMessage}
          />
        ))}

        {isWaiting && !messages.some((m) => m.isStreaming) && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ flexShrink:0, padding:"10px 14px 14px" }}>
        <ChatInput onSend={sendMessage} disabled={!canSend} />
      </div>
    </div>
  );
}