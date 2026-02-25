"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,          // ⭐ NEW
} from "react";

import { useChat, ChatMessage, SocketStatus } from "../hooks/useChat";
import { useSession, SessionStatus } from "../hooks/useSession";
import { useCompany, CompanyStatus } from "../hooks/useCompany";
import type { Company, ResolvedModality } from "../types/company";

const COMPANY_ID = (process.env.NEXT_PUBLIC_COMPANY_ID ?? "").trim();

interface ChatContextValue {
  company: Company | null;
  companyStatus: CompanyStatus;
  companyError: string | null;
  retryCompany: () => void;

  modalities: ResolvedModality[];
  selectedModality: ResolvedModality | null;
  selectModality: (modality: ResolvedModality) => void;

  sessionId: string | number | null;
  sessionStatus: SessionStatus;
  sessionError: string | null;
  retrySession: () => void;
  resetSession: () => void;

  messages: ChatMessage[];
  transcript: string;          // ⭐ NEW
  socketStatus: SocketStatus;
  isWaiting: boolean;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  languageCode = "en",
}: {
  children: React.ReactNode;
  languageCode?: string;
}) {
  const [selectedModality, setSelectedModality] =
    useState<ResolvedModality | null>(null);

  const {
    company,
    modalities,
    status: companyStatus,
    error: companyError,
    retry: retryCompany,
  } = useCompany(COMPANY_ID, languageCode);

  const {
    sessionId,
    status: sessionStatus,
    error: sessionError,
    retry: retrySession,
    reset: resetSessionInternal,
    start: startSession,
  } = useSession({
    flowType: selectedModality?.key ?? null,
    languageCode,
    autoStart: false,
  });

  const { messages, socketStatus, isWaiting, sendMessage, clearMessages } =
    useChat({
      sessionId,
      flowType: selectedModality?.key ?? null,
      languageCode,
    });

  // ✅ Accumulated Transcript
  const transcript = useMemo(() => {
    return messages
      .map((m) => `${m.role === "user" ? "User" : "Bot"}: ${m.content}`)
      .join("\n");
  }, [messages]);

  // ✅ Console Log FULL Transcript Automatically
  useEffect(() => {
    if (!messages.length) return;

    console.log("──────── CHAT TRANSCRIPT ────────");
    console.log(transcript);
    console.log("────────────────────────────────");
  }, [transcript, messages.length]);

  const selectModality = useCallback(
    (modality: ResolvedModality) => {
      setSelectedModality(modality);
      startSession(modality.key);
    },
    [startSession],
  );

  const resetSession = useCallback(() => {
    setSelectedModality(null);
    clearMessages();
    resetSessionInternal();
  }, [clearMessages, resetSessionInternal]);

  return (
    <ChatContext.Provider
      value={{
        company,
        companyStatus,
        companyError,
        retryCompany,
        modalities,
        selectedModality,
        selectModality,
        sessionId,
        sessionStatus,
        sessionError,
        retrySession,
        resetSession,
        messages,
        transcript,          // ⭐ NEW
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