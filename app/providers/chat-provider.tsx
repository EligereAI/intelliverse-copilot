"use client";

import React, { createContext, useContext } from "react";
import { useChat, ChatMessage, SocketStatus } from "../hooks/useChat";
import { useSession, SessionStatus } from "../hooks/useSession";

interface ChatContextValue {
  // Session
  sessionId: string | number | null;
  sessionStatus: SessionStatus;
  sessionError: string | null;
  retrySession: () => void;
  resetSession: () => void;

  // Socket + Messages
  messages: ChatMessage[];
  socketStatus: SocketStatus;
  isWaiting: boolean;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  flowType,
  languageCode,
}: {
  children: React.ReactNode;
  flowType?: string | null;
  languageCode?: string;
}) {
  const {
    sessionId,
    status: sessionStatus,
    error: sessionError,
    retry: retrySession,
    reset: resetSession,
  } = useSession({ flowType, languageCode });

  const { messages, socketStatus, isWaiting, sendMessage, clearMessages } =
    useChat({
      sessionId,
      flowType,
      languageCode,
    });

  return (
    <ChatContext.Provider
      value={{
        sessionId,
        sessionStatus,
        sessionError,
        retrySession,
        resetSession,
        messages,
        socketStatus,
        isWaiting,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}