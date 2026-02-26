"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RAW_WS = (
  process.env.NEXT_PUBLIC_WS_URL ?? "wss://devsockets.elisa.live"
).replace(/\/$/, "");
const COMPANY_ID = (process.env.NEXT_PUBLIC_COMPANY_ID ?? "").trim();
const USER_ID = 1234;
const END_TOKEN = "END_OF_RESPONSE_TOKEN";

export type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

export interface Source {
  title: string;
  link: string;
  file_name: string;
  file_type: string;
  page_number: number | null;
  score: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  isStreaming?: boolean;
  /** True after END_TOKEN received but before stream-end (sources still loading) */
  isProcessingMeta?: boolean;
  timestamp: Date;
  sources?: Source[];
  promptbackQuestions?: string[];
  /** Server-assigned IDs — used for feedback payload */
  responseId?: string;
  queryId?: string;
}

interface UseChatOptions {
  sessionId: string | number | null;
  flowType?: string | null;
  languageCode?: string | null;
  additionalInfo?: Record<string, unknown>;
}

export interface FeedbackPayload {
  responseId: string;
  queryId?: string;
  liked: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  socketStatus: SocketStatus;
  isWaiting: boolean;
  sendMessage: (text: string) => void;
  sendFeedback: (payload: FeedbackPayload) => void;
  clearMessages: () => void;
}

function genId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function parseMetadata(raw: string): { sources: Source[]; promptbackQuestions: string[] } {
  try {
    const parsed = JSON.parse(raw);
    return {
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      promptbackQuestions: Array.isArray(parsed.promptback_question) ? parsed.promptback_question : [],
    };
  } catch {
    return { sources: [], promptbackQuestions: [] };
  }
}

function visibleText(raw: string): string {
  const idx = raw.indexOf(END_TOKEN);
  return idx >= 0 ? raw.slice(0, idx) : raw;
}

export function useChat({
  sessionId,
  flowType = null,
  languageCode = null,
  additionalInfo,
}: UseChatOptions): UseChatReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRidRef = useRef<string | null>(null);
  const stoppedRidsRef = useRef<Set<string>>(new Set());
  const rawBufferRef = useRef<string>("");
  const flowTypeRef = useRef<string | null>(flowType);
  flowTypeRef.current = flowType;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("disconnected");
  const [isWaiting, setIsWaiting] = useState(false);

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) return;

    const url = RAW_WS + USER_ID;
    setSocketStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setSocketStatus("connected");
      if (reconnTimerRef.current) clearTimeout(reconnTimerRef.current);
    };
    ws.onerror = () => setSocketStatus("error");
    ws.onclose = () => {
      setSocketStatus("disconnected");
      reconnTimerRef.current = setTimeout(connect, 3000);
    };

    ws.onmessage = (event) => {
      let data: Record<string, unknown>;
      try { data = JSON.parse(event.data as string); } catch { return; }

      if (data.status === "error") {
        setIsWaiting(false);
        setMessages((prev) => [...prev, {
          id: genId(), sender: "bot",
          text: "Service temporarily unavailable. Please try again.",
          isStreaming: false, timestamp: new Date(),
        }]);
        return;
      }

      // Track both response_id and query_id from every message
      const rid = data.response_id != null ? String(data.response_id) : null;
      const qid = data.query_id != null ? String(data.query_id) : null;

      if (rid && stoppedRidsRef.current.has(rid)) return;
      if (rid && currentRidRef.current && rid !== currentRidRef.current) return;

      const response = data.response as { text: string; passing: boolean } | undefined;
      if (!response) return;

      // Handle end of stream
      if (response.text === "stream-end") {
        const full = rawBufferRef.current;
        const endIdx = full.indexOf(END_TOKEN);
        const metaRaw = endIdx >= 0 ? full.slice(endIdx + END_TOKEN.length).trim() : "";
        const { sources, promptbackQuestions } = parseMetadata(metaRaw);

        setMessages((prev) => prev.map((m) =>
          m.isStreaming
            ? { ...m, isStreaming: false, isProcessingMeta: false, sources, promptbackQuestions }
            : m,
        ));
        setIsWaiting(false);
        rawBufferRef.current = "";
        currentRidRef.current = null;
        return;
      }

      // Handle incoming streaming chunk
      if (response.passing && typeof response.text === "string") {
        rawBufferRef.current += response.text;
        const display = visibleText(rawBufferRef.current);
        const hitEndToken = rawBufferRef.current.includes(END_TOKEN);

        if (!display) return;

        setMessages((prev) => {
          const hasStreaming = prev.some((m) => m.isStreaming);
          if (hasStreaming) {
            return prev.map((m) => m.isStreaming
              ? { ...m, text: display, isProcessingMeta: hitEndToken }
              : m,
            );
          }
          if (rid) currentRidRef.current = rid;
          return [...prev, {
            id: rid ?? genId(),
            sender: "bot",
            text: display,
            isStreaming: true,
            isProcessingMeta: false,
            // Attach server IDs so they're available for feedback later
            responseId: rid ?? undefined,
            queryId: qid ?? undefined,
            timestamp: new Date(),
          }];
        });
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnTimerRef.current) clearTimeout(reconnTimerRef.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!sessionId) { console.warn("[useChat] no sessionId"); return; }
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("[useChat] socket not open, state:", ws?.readyState);
      return;
    }

    setMessages((prev) => [...prev, {
      id: genId(), sender: "user", text,
      isStreaming: false, timestamp: new Date(),
    }]);
    setIsWaiting(true);
    rawBufferRef.current = "";

    const payload: Record<string, unknown> = {
      userId: USER_ID, companyId: COMPANY_ID,
      message: text, sessionId,
      isDetail: false, regenerate: false,
      flow_type: flowTypeRef.current,
      language_code: languageCode,
    };
    if (additionalInfo && Object.keys(additionalInfo).length > 0)
      payload.additional_info = additionalInfo;

    ws.send(JSON.stringify(payload));
  }, [sessionId, languageCode, additionalInfo]);

  /**
   * Send like/dislike feedback — matches server spec exactly:
   * { userId, sessionId, companyId, feedback:true, queryId, responseId, liked, comment:null, flow_type }
   */
  const sendFeedback = useCallback(({ responseId, queryId, liked }: FeedbackPayload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("[useChat] socket not open for feedback");
      return;
    }
    const payload: Record<string, unknown> = {
      userId: USER_ID,
      sessionId,
      companyId: COMPANY_ID,
      feedback: true,
      queryId: queryId ?? null,
      responseId,
      liked,
      comment: null,
      flow_type: flowTypeRef.current,
    };
    ws.send(JSON.stringify(payload));
  }, [sessionId]);

  const clearMessages = useCallback(() => setMessages([]), []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { messages, socketStatus, isWaiting, sendMessage, sendFeedback, clearMessages };
}