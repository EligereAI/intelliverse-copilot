"use client";

import { ChatMessage as ChatMessageType } from "../../hooks/useChat";

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.sender === "user";

  return (
    <>
      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes caretBlink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        .chat-bubble { animation: msgIn 0.22s ease forwards; }
        .streaming-caret {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: currentColor;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: caretBlink 0.9s ease-in-out infinite;
        }
      `}</style>

      <div
        className="chat-bubble"
        style={{
          display: "flex",
          justifyContent: isUser ? "flex-end" : "flex-start",
          padding: "3px 0",
        }}
      >
        <div
          style={{
            maxWidth: "72%",
            padding: isUser ? "10px 14px" : "11px 15px",
            borderRadius: isUser
              ? "16px 16px 4px 16px"
              : "16px 16px 16px 4px",
            background: isUser
              ? "linear-gradient(135deg, #c4103a 0%, #8b0a28 100%)"
              : "#ffffff",
            color: isUser ? "#ffffff" : "#1a1916",
            fontSize: 14,
            lineHeight: 1.6,
            fontWeight: 400,
            boxShadow: isUser
              ? "0 2px 12px rgba(196,16,58,0.3)"
              : "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            letterSpacing: "0.01em",
          }}
        >
          {message.text}
          {message.isStreaming && <span className="streaming-caret" />}
        </div>
      </div>
    </>
  );
}