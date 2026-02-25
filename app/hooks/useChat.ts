"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RAW_WS = (
  process.env.NEXT_PUBLIC_WS_URL ?? "wss://devsockets.elisa.live"
).replace(/\/$/, "");
const COMPANY_ID = (process.env.NEXT_PUBLIC_COMPANY_ID ?? "").trim();
const USER_ID = 1234;
const END_TOKEN = "END_OF_RESPONSE_TOKEN";

export type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  isStreaming?: boolean;
  timestamp: Date;
}

interface UseChatOptions {
  sessionId: string | number | null;
  flowType?: string | null;
  languageCode?: string | null;
  additionalInfo?: Record<string, unknown>;
}

interface UseChatReturn {
  messages: ChatMessage[];
  socketStatus: SocketStatus;
  isWaiting: boolean;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

function genId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
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
  const bufferRef = useRef<string>("");

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
    )
      return;

    const url = RAW_WS + USER_ID;
    console.log("[useChat] Connecting:", url);
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
      try {
        data = JSON.parse(event.data as string);
      } catch {
        return;
      }

      if (data.status === "error") {
        setIsWaiting(false);
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            sender: "bot",
            text: "Service temporarily unavailable. Please try again.",
            isStreaming: false,
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const rid = data.response_id != null ? String(data.response_id) : null;
      if (rid && stoppedRidsRef.current.has(rid)) return;
      if (rid && currentRidRef.current && rid !== currentRidRef.current) return;

      const response = data.response as { text: string; passing: boolean } | undefined;
      if (!response) return;

      if (response.text === "stream-end") {
        setMessages((prev) =>
          prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
        );
        setIsWaiting(false);
        bufferRef.current = "";
        currentRidRef.current = null;
        return;
      }

      if (response.passing && typeof response.text === "string") {
        const endIdx = response.text.indexOf(END_TOKEN);
        const safeChunk = endIdx >= 0 ? response.text.slice(0, endIdx) : response.text;
        if (!safeChunk) return;

        bufferRef.current += safeChunk;
        const accumulated = bufferRef.current;

        setMessages((prev) => {
          const hasStreaming = prev.some((m) => m.isStreaming);
          if (hasStreaming)
            return prev.map((m) => (m.isStreaming ? { ...m, text: accumulated } : m));
          if (rid) currentRidRef.current = rid;
          return [
            ...prev,
            {
              id: rid ?? genId(),
              sender: "bot",
              text: accumulated,
              isStreaming: true,
              timestamp: new Date(),
            },
          ];
        });
      }
    };
  }, []);  

  const disconnect = useCallback(() => {
    if (reconnTimerRef.current) clearTimeout(reconnTimerRef.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!sessionId) {
        console.warn("[useChat] no sessionId");
        return;
      }
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn("[useChat] socket not open, state:", ws?.readyState);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: genId(), sender: "user", text, isStreaming: false, timestamp: new Date() },
      ]);
      setIsWaiting(true);
      bufferRef.current = "";

      const payload: Record<string, unknown> = {
        userId: USER_ID,
        companyId: COMPANY_ID,
        message: text,
        sessionId,
        isDetail: false,
        regenerate: false,
        flow_type: flowTypeRef.current,
        language_code: languageCode,
      };
      if (additionalInfo && Object.keys(additionalInfo).length > 0)
        payload.additional_info = additionalInfo;

      console.log("[useChat] Sending:", payload);
      ws.send(JSON.stringify(payload));
    },
    [sessionId, languageCode, additionalInfo],
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { messages, socketStatus, isWaiting, sendMessage, clearMessages };
}