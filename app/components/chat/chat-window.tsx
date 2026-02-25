"use client";

import ChatInput from "./chat-input";

export default function ChatWindow() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}>

      {/* Chat Area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {/* Messages will render here */}
      </div>

      {/* Input Area — sits on a slightly elevated surface */}
      <div style={{
        flexShrink: 0,
        background: "transparent",
        padding: "12px 14px 14px",
      }}>
        <ChatInput />
      </div>

    </div>
  );
}