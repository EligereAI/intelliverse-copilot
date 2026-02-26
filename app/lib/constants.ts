// Connection constants that must match the backend
// WS URL uses a query-param userId, not a path segment (e.g. wss://devsockets.elisa.live?userId=1234)
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "wss://devsockets.elisa.live";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://devsockets.elisa.live";

export const COMPANY_ID =
  process.env.NEXT_PUBLIC_COMPANY_ID ?? "";

export const USER_ID = 1234;

// REST endpoints
export const ENDPOINTS = {
  SESSION: "create_session",
  MAIL: "mail",
  TRANSCRIBE: "transcribe",
} as const;

// WebSocket end-of-stream sentinel
export const END_TOKEN = "END_OF_RESPONSE_TOKEN";