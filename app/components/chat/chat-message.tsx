"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChatMessage as ChatMessageType } from "../../hooks/useChat";

// ─── Load marked once globally ────────────────────────────────────────────────
let markedLoaded = false;
function ensureMarked(cb?: () => void) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).__markedLib) { cb?.(); return; }
  if (markedLoaded) {
    const poll = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__markedLib) { clearInterval(poll); cb?.(); }
    }, 50);
    return;
  }
  markedLoaded = true;
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  script.onload = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__markedLib = (window as any).marked;
    cb?.();
  };
  document.head.appendChild(script);
}

// ─── iframeConvert helpers ────────────────────────────────────────────────────

function removeTrailingPeriod(url: string) {
  return url.endsWith(".") ? url.slice(0, -1) : url;
}
function stringEndsWithImageExtension(url: string) {
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(url);
}
function isYoutubePlaylistUrl(url: string) {
  return url.includes("youtube") && url.includes("list=") && !url.includes("v=");
}
function extractVideoID(url: string) {
  const m = url.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function generateEmbedURL(id: string | null) {
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

function convertToHtml(raw: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markedLib = typeof window !== "undefined" && (window as any).__markedLib;
  let html: string = markedLib
    ? markedLib.parse(raw, { breaks: true, gfm: true })
    : raw.replace(/\n/g, "<br>");

  const urlRegex = /https?:\/\/[^\s"<>)]+/g;
  const urls: { url: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(html)) !== null) {
    urls.push({ url: m[0], index: m.index });
  }
  urls.sort((a, b) => b.index - a.index);

  for (const { url, index } of urls) {
    const clean = removeTrailingPeriod(url);
    if ((url.includes("youtube") || url.includes("youtu.be")) && !isYoutubePlaylistUrl(url)) {
      const videoId = extractVideoID(clean);
      let embedSrc = generateEmbedURL(videoId);
      if (url.includes("shorts")) embedSrc = clean.replace(/\/shorts\//, "/embed/");
      const replacement =
        `<br><div style="margin:8px 0"><iframe width="100%" height="220" src="${embedSrc}" ` +
        `title="YouTube video player" frameborder="0" ` +
        `allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" ` +
        `allowfullscreen style="border-radius:8px;display:block;"></iframe></div><br>`;
      html = html.slice(0, index) + replacement + html.slice(index + url.length);
    } else if (stringEndsWithImageExtension(url) || url.includes("article_attachments")) {
      const replacement = `<img src="${clean}" style="max-width:100%;border-radius:6px;margin:6px 0;display:block;" alt="" />`;
      html = html.slice(0, index) + replacement + html.slice(index + url.length);
    }
  }
  return html;
}

// ─── Avatar components ────────────────────────────────────────────────────────

function BotAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
      <Image src="/nova-icon.svg" alt="Bot" width={28} height={28} style={{ display: "block" }} />
    </div>
  );
}

function UserAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #e8e4de 0%, #ccc8c1 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a847d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function Gutter() {
  return <div style={{ width: 28, flexShrink: 0 }} />;
}

function dedupeByLink(sources: ChatMessageType["sources"]) {
  if (!sources?.length) return [];
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (seen.has(s.link)) return false;
    seen.add(s.link);
    return true;
  });
}

// ─── Markdown bubble ──────────────────────────────────────────────────────────

function MarkdownBubble({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  const render = () => {
    if (ref.current) ref.current.innerHTML = convertToHtml(text);
  };

  useEffect(() => {
    ensureMarked(render);
  });

  return (
    <>
      <style>{`
        .md-bubble { font-size:14px; line-height:1.65; color:#1a1916; word-break:break-word; }
        .md-bubble p { margin:0 0 8px; }
        .md-bubble p:last-child { margin-bottom:0; }
        .md-bubble h1,.md-bubble h2,.md-bubble h3,.md-bubble h4 {
          margin:12px 0 5px; font-weight:700; line-height:1.3; color:#111;
        }
        .md-bubble h1 { font-size:17px; }
        .md-bubble h2 { font-size:15px; }
        .md-bubble h3 { font-size:14px; }
        .md-bubble ul { margin:4px 0 8px 0; padding-left:20px; list-style-type:disc; }
        .md-bubble ol { margin:4px 0 8px 0; padding-left:20px; list-style-type:decimal; }
        .md-bubble ul ul { list-style-type:circle; margin:2px 0 2px 0; }
        .md-bubble ul ul ul { list-style-type:square; }
        .md-bubble li { margin-bottom:3px; display:list-item; }
        .md-bubble strong { font-weight:700; }
        .md-bubble em { font-style:italic; }
        .md-bubble hr { border:none; border-top:1px solid #e8e2da; margin:10px 0; }
        .md-bubble code {
          background:#f3ede6; border-radius:4px; padding:1px 5px;
          font-size:12.5px; font-family:ui-monospace,monospace; color:#8b0a28;
        }
        .md-bubble pre {
          background:#1a1916; border-radius:8px; padding:12px 14px;
          overflow-x:auto; margin:8px 0;
        }
        .md-bubble pre code { background:none; color:#e8e4de; padding:0; }
        .md-bubble a { color:#c4103a; text-decoration:none; word-wrap:anywhere; }
        .md-bubble a:hover { text-decoration:underline; }
        .md-bubble blockquote {
          border-left:3px solid #e8e2da; margin:8px 0; padding:4px 12px;
          color:#6b6560; font-style:italic;
        }
        .md-bubble table {
          width:100%; border-collapse:collapse; font-size:13px;
          margin:10px 0; border-radius:8px; overflow:hidden;
          box-shadow:0 0 0 1px rgba(0,0,0,0.09);
        }
        .md-bubble th {
          background:#f5f0eb; font-weight:700; text-align:left;
          padding:7px 10px; border-bottom:1px solid #e8e2da;
          font-size:11.5px; text-transform:uppercase; letter-spacing:.04em; color:#1a1916;
        }
        .md-bubble td {
          padding:6px 10px; border-bottom:1px solid #f0ebe4;
          color:#2e2a26; vertical-align:top;
        }
        .md-bubble tr:last-child td { border-bottom:none; }
        .md-bubble tr:nth-child(even) td { background:#faf7f4; }
        @keyframes caretBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .streaming-caret {
          display:inline-block; width:2px; height:1em;
          background:#1a1916; margin-left:2px; vertical-align:text-bottom;
          animation:caretBlink .9s ease-in-out infinite;
        }
      `}</style>
      <div ref={ref} className="md-bubble" />
      {isStreaming && <span className="streaming-caret" />}
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  message: ChatMessageType;
  showAvatar: boolean;
  /** True only for the most recent bot message in the list */
  hasNewerMessage: boolean;
  onPromptbackClick?: (question: string) => void;
}

export default function ChatMessage({ message, showAvatar, hasNewerMessage, onPromptbackClick }: Props) {
  const isUser = message.sender === "user";
  const uniqueSources = dedupeByLink(message.sources);
  const hasSources = !isUser && uniqueSources.length > 0;

  // Dismissed when user clicks a suggestion OR when a newer message has arrived
  const [dismissed, setDismissed] = useState(false);

  
  // (i.e. user sent something new)
  useEffect(() => {
    if (hasNewerMessage) setDismissed(true);
  }, [hasNewerMessage]);

  const rawPromptbacks = !isUser && !message.isStreaming
    ? (message.promptbackQuestions ?? [])
    : [];
  const showPromptbacks = rawPromptbacks.length > 0 && !dismissed;

  function handlePromptbackClick(q: string) {
    setDismissed(true);
    onPromptbackClick?.(q);
  }

  return (
    <>
      <style>{`
        @keyframes msgIn    { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes extrasIn { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideOut {
          from { opacity:1; transform:translateY(0);   max-height:200px; }
          to   { opacity:0; transform:translateY(-6px); max-height:0;     }
        }
        .chat-bubble  { animation:msgIn .2s ease forwards; }
        .extras-in    { animation:extrasIn .22s ease forwards; }
        .slide-out    {
          animation:slideOut .22s ease forwards;
          overflow:hidden; pointer-events:none;
        }
        .source-link {
          display:flex; align-items:flex-start; gap:6px;
          color:#c4103a; text-decoration:none; font-size:12px;
          line-height:1.45; padding:2px 0; transition:color .15s;
        }
        .source-link:hover { color:#8b0a28; text-decoration:underline; }
        .promptback-btn {
          display:block; width:100%; text-align:left;
          background:#fff; border:1px solid #e8e2da; border-radius:10px;
          padding:8px 12px; font-size:13px; line-height:1.45;
          color:#1a1916; cursor:pointer; font-family:inherit;
          transition:background .15s,border-color .15s,transform .1s;
        }
        .promptback-btn:hover  { background:#fdf7f4; border-color:#c4103a; color:#c4103a; transform:translateX(2px); }
        .promptback-btn:active { transform:translateX(1px); }
      `}</style>

      {/* ── Message bubble ── */}
      <div className="chat-bubble" style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        padding: "2px 0",
      }}>
        {showAvatar ? (isUser ? <UserAvatar /> : <BotAvatar />) : <Gutter />}

        <div style={{
          maxWidth: "74%",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? "linear-gradient(135deg,#c4103a 0%,#8b0a28 100%)" : "#ffffff",
          color: isUser ? "#ffffff" : "#1a1916",
          boxShadow: isUser
            ? "0 2px 12px rgba(196,16,58,0.28)"
            : "0 1px 4px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}>
          <div style={{ padding: isUser ? "10px 14px" : "11px 15px" }}>
            {isUser ? (
              <span style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {message.text}
              </span>
            ) : (
              <MarkdownBubble text={message.text} isStreaming={message.isStreaming} />
            )}
          </div>

          {/* Related reading — always visible inside the bubble */}
          {hasSources && (
            <div className="extras-in" style={{
              borderTop: "1px solid rgba(0,0,0,0.07)",
              padding: "8px 15px 11px",
            }}>
              <p style={{
                margin: "0 0 5px", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.07em", textTransform: "uppercase", color: "#a09b94",
              }}>
                Related reading
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {uniqueSources.map((src, i) => (
                  <a key={i} href={src.link} target="_blank" rel="noopener noreferrer" className="source-link">
                    <svg style={{ flexShrink: 0, marginTop: 2, opacity: 0.65 }}
                      width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {src.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Suggested questions — dismissed on click or new message ── */}
      {rawPromptbacks.length > 0 && (
        <div
          className={`extras-in ${dismissed ? "slide-out" : ""}`}
          style={{
            display: "flex", flexDirection: "row", alignItems: "flex-start",
            gap: 8, padding: "4px 0 2px",
          }}
        >
          <Gutter />
          <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", gap: 5 }}>
            <p style={{
              margin: "0 0 1px", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.07em", textTransform: "uppercase",
              color: "#a09b94", paddingLeft: 2,
            }}>
              Suggested questions
            </p>
            {rawPromptbacks.slice(0, 3).map((q, i) => (
              <button
                key={i}
                className="promptback-btn"
                onClick={() => handlePromptbackClick(q)}
              >
                <span style={{ marginRight: 6, opacity: 0.4, fontSize: 11 }}>↩</span>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}