"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSession } from "@/app/services/session/createSession";

const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? "";
const SESSION_TTL_MS = 23 * 60 * 60 * 1000; // 23 h

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
  /** Manual trigger — pass a flowType to override the hook option */
  start: (flowType?: string | null) => void;
  retry: () => void;
  reset: () => void;
}

export function useSession({
  flowType: defaultFlowType = null,
  languageCode = "en",
  autoStart = false,        // default OFF — provider controls when to fire
}: UseSessionOptions = {}): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string | number | null>(null);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Keep a mutable ref so async callbacks always see latest values
  const optsRef = useRef({ flowType: defaultFlowType, languageCode });
  optsRef.current = { flowType: defaultFlowType, languageCode };

  // Storage helpers 
  const sessionKey = `nova_session_${COMPANY_ID}_${defaultFlowType ?? "none"}`;

  const restore = useCallback(
    (flowType: string | null): StoredSession | null => {
      const key = `nova_session_${COMPANY_ID}_${flowType ?? "none"}`;
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const s: StoredSession = JSON.parse(raw);
        if (Date.now() - s.createdAt > SESSION_TTL_MS) {
          sessionStorage.removeItem(key);
          return null;
        }
        if (s.flowType !== flowType) {
          sessionStorage.removeItem(key);
          return null;
        }
        return s;
      } catch {
        return null;
      }
    },
    [],
  );

  const persist = useCallback(
    (id: string | number, flowType: string | null) => {
      const key = `nova_session_${COMPANY_ID}_${flowType ?? "none"}`;
      try {
        const payload: StoredSession = {
          sessionId: id,
          createdAt: Date.now(),
          flowType,
        };
        sessionStorage.setItem(key, JSON.stringify(payload));
      } catch {
        /* storage blocked */
      }
    },
    [],
  );

  // ── Core init — accepts an explicit flowType override ─────────────────────
  const init = useCallback(
    async (flowType: string | null, forceNew = false) => {
      if (!forceNew) {
        const stored = restore(flowType);
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
          flow_type: flowType,
          language_code: optsRef.current.languageCode,
        });
        setSessionId(data.session_id);
        persist(data.session_id, flowType);
        setStatus("active");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setStatus("error");
      }
    },
    [restore, persist],
  );

  // Public API
  /** Called by the provider when the user picks a modality */
  const start = useCallback(
    (flowType?: string | null) => {
      const ft = flowType !== undefined ? flowType : defaultFlowType;
      init(ft, false);
    },
    [init, defaultFlowType],
  );

  const retry = useCallback(
    () => init(defaultFlowType, false),
    [init, defaultFlowType],
  );

  const reset = useCallback(() => {
    const key = `nova_session_${COMPANY_ID}_${defaultFlowType ?? "none"}`;
    sessionStorage.removeItem(key);
    setSessionId(null);
    setStatus("idle");
    setError(null);
    // Don't auto-restart — provider will call start() explicitly
  }, [defaultFlowType]);

  // Auto-start (only if explicitly enabled)
  useEffect(() => {
    if (autoStart) init(defaultFlowType, false);
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expiry watcher
  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => {
      if (!restore(defaultFlowType)) {
        setStatus("expired");
        setSessionId(null);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [status, restore, defaultFlowType]);

  return { sessionId, status, error, start, retry, reset };
}