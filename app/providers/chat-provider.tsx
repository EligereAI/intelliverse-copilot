"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useChat, ChatMessage, SocketStatus, FeedbackPayload } from "../hooks/useChat";
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
  socketStatus: SocketStatus;
  isWaiting: boolean;
  sendMessage: (text: string) => void;
  sendFeedback: (payload: FeedbackPayload) => void;
  clearMessages: () => void;

  // Feature flags
  collectFeedback: boolean;
  requiredSupportButton: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  languageCode = "en",
}: {
  children: React.ReactNode;
  languageCode?: string;
}) {
  const [selectedModality, setSelectedModality] = useState<ResolvedModality | null>(null);

  const {
    company,
    modalities,
    status: companyStatus,
    error: companyError,
    retry: retryCompany,
    collectFeedback,
    requiredSupportButton,
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

  const { messages, socketStatus, isWaiting, sendMessage, sendFeedback, clearMessages } =
    useChat({
      sessionId,
      flowType: selectedModality?.key ?? null,
      languageCode,
    });

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
        socketStatus,
        isWaiting,
        sendMessage,
        sendFeedback,
        clearMessages,
        collectFeedback,
        requiredSupportButton,
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