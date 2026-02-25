"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSession } from "@/app/services/session/createSession";

const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? "";
const SESSION_KEY = `nova_session_${COMPANY_ID}`;
const SESSION_TTL_MS = 23 * 60 * 60 * 1000; // 23 h — backend TTL is ~24 h

export type SessionStatus =
  | "idle"
  | "creating"
  | "active"
  | "error"
  | "expired";

interface StoredSession {
  sessionId: string | number;
  createdAt: number;
  flowType?: string | null;
}

interface UseSessionOptions {
  flowType?: string | null;
  languageCode?: string;
  autoStart?: boolean;
}

export interface UseSessionReturn {
  sessionId: string | number | null;
  status: SessionStatus;
  error: string | null;
  retry: () => void;
  reset: () => void;
}

export function useSession({
  flowType = null,
  languageCode = "en",
  autoStart = true,
}: UseSessionOptions = {}): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string | number | null>(null);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const optsRef = useRef({ flowType, languageCode });
  optsRef.current = { flowType, languageCode };

  // ── Storage helpers ────────────────────────────────────────────────────────
  const restore = useCallback((): StoredSession | null => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s: StoredSession = JSON.parse(raw);
      if (Date.now() - s.createdAt > SESSION_TTL_MS) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      if (s.flowType !== optsRef.current.flowType) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return s;
    } catch {
      return null;
    }
  }, []);

  const persist = useCallback((id: string | number) => {
    try {
      const payload: StoredSession = {
        sessionId: id,
        createdAt: Date.now(),
        flowType: optsRef.current.flowType,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch { /* storage blocked */ }
  }, []);

  // ── Core init ──────────────────────────────────────────────────────────────
  const init = useCallback(
    async (forceNew = false) => {
      if (forceNew) sessionStorage.removeItem(SESSION_KEY);

      if (!forceNew) {
        const stored = restore();
        if (stored) {
          setSessionId(stored.sessionId);
          setStatus("active");
          setError(null);
          return;
        }
      }

      setStatus("creating");
      setError(null);

      try {
        const data = await createSession({
          company_id: COMPANY_ID,
          flow_type: optsRef.current.flowType,
          language_code: optsRef.current.languageCode,
        });
        setSessionId(data.session_id);
        persist(data.session_id);
        setStatus("active");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setStatus("error");
      }
    },
    [restore, persist]
  );

  const retry = useCallback(() => init(false), [init]);
  const reset = useCallback(() => {
    setSessionId(null);
    setStatus("idle");
    setError(null);
    init(true);
  }, [init]);

  // Auto-start
  useEffect(() => {
    if (autoStart) init(false);
  }, [autoStart, init]);

  // Periodic expiry check
  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => {
      if (!restore()) {
        setStatus("expired");
        setSessionId(null);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [status, restore]);

  return { sessionId, status, error, retry, reset };
}