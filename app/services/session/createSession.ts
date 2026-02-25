const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://devsockets.elisa.live"
).replace(/\/$/, "");

export interface SessionResponse {
  session_id: string | number;
  [key: string]: unknown;
}

export interface CreateSessionParams {
  company_id: string;
  language_code?: string;
  flow_type?: string | null;
  uid?: string | null;
}

export async function createSession(
  params: CreateSessionParams,
): Promise<SessionResponse> {
  const res = await fetch(`${API_URL}/create_session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: params.company_id,
      uid: params.uid ?? null,
      language_code: params.language_code ?? "en",
      flow_type: params.flow_type ?? null,  // never hardcode — always use what's passed
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Session creation failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`,
    );
  }

  const data = await res.json();
  if (!data.session_id) throw new Error("Backend returned no session_id");
  return data as SessionResponse;
}