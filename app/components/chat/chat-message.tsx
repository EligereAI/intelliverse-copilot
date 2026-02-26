"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChatMessage as ChatMessageType, FeedbackPayload } from "../../hooks/useChat";

// Load marked.js from CDN on demand
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
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  s.onload = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__markedLib = (window as any).marked;
    cb?.();
  };
  document.head.appendChild(s);
}

// URL helper functions
function removeTrailingPeriod(u: string) { return u.endsWith(".") ? u.slice(0, -1) : u; }
function isImage(u: string) { return /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(u); }
function isYTPlaylist(u: string) { return u.includes("youtube") && u.includes("list=") && !u.includes("v="); }
function extractVID(u: string) { const m = u.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : null; }
function embedURL(id: string | null) { return id ? `https://www.youtube.com/embed/${id}` : ""; }

function convertToHtml(raw: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ml = typeof window !== "undefined" && (window as any).__markedLib;
  let html = ml ? ml.parse(raw, { breaks: true, gfm: true }) : raw.replace(/\n/g, "<br>");
  const urlRe = /https?:\/\/[^\s"<>)]+/g;
  const urls: { url: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(html)) !== null) urls.push({ url: m[0], index: m.index });
  urls.sort((a, b) => b.index - a.index);
  for (const { url, index } of urls) {
    const clean = removeTrailingPeriod(url);
    if ((url.includes("youtube") || url.includes("youtu.be")) && !isYTPlaylist(url)) {
      const vid = extractVID(clean);
      const src = url.includes("shorts") ? clean.replace(/\/shorts\//, "/embed/") : embedURL(vid);
      html = html.slice(0, index) + `<br><div style="margin:8px 0"><iframe width="100%" height="220" src="${src}" title="YouTube video player" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen style="border-radius:8px;display:block;"></iframe></div><br>` + html.slice(index + url.length);
    } else if (isImage(url) || url.includes("article_attachments")) {
      html = html.slice(0, index) + `<img src="${clean}" style="max-width:100%;border-radius:6px;margin:6px 0;display:block;" alt="" />` + html.slice(index + url.length);
    }
  }
  return html;
}

// Avatar components
function BotAvatar() {
  return (
    <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.12)" }}>
      <Image src="/nova-icon.svg" alt="Bot" width={28} height={28} style={{ display:"block" }} />
    </div>
  );
}
function UserAvatar() {
  return (
    <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#e8e4de 0%,#ccc8c1 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.10)" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a847d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  );
}
function Gutter() { return <div style={{ width:28, flexShrink:0 }} />; }

function dedupeByLink(s: ChatMessageType["sources"]) {
  if (!s?.length) return [];
  const seen = new Set<string>();
  return s.filter((x) => { if (seen.has(x.link)) return false; seen.add(x.link); return true; });
}

// Markdown-rendering chat bubble
function MarkdownBubble({ text, isStreaming, isProcessingMeta }: { text: string; isStreaming?: boolean; isProcessingMeta?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ensureMarked(() => { if (ref.current) ref.current.innerHTML = convertToHtml(text); }); });
  const showCaret = isStreaming && !isProcessingMeta;
  return (
    <>
      <style>{`
        .md-bubble{font-size:14px;line-height:1.65;color:#1a1916;word-break:break-word}
        .md-bubble p{margin:0 0 8px}.md-bubble p:last-child{margin-bottom:0}
        .md-bubble h1,.md-bubble h2,.md-bubble h3,.md-bubble h4{margin:12px 0 5px;font-weight:700;line-height:1.3;color:#111}
        .md-bubble h1{font-size:17px}.md-bubble h2{font-size:15px}.md-bubble h3{font-size:14px}
        .md-bubble ul{margin:4px 0 8px 0;padding-left:20px;list-style-type:disc}
        .md-bubble ol{margin:4px 0 8px 0;padding-left:20px;list-style-type:decimal}
        .md-bubble ul ul{list-style-type:circle;margin:2px 0}.md-bubble ul ul ul{list-style-type:square}
        .md-bubble li{margin-bottom:3px;display:list-item}
        .md-bubble strong{font-weight:700}.md-bubble em{font-style:italic}
        .md-bubble hr{border:none;border-top:1px solid #e8e2da;margin:10px 0}
        .md-bubble code{background:#f3ede6;border-radius:4px;padding:1px 5px;font-size:12.5px;font-family:ui-monospace,monospace;color:#8b0a28}
        .md-bubble pre{background:#1a1916;border-radius:8px;padding:12px 14px;overflow-x:auto;margin:8px 0}
        .md-bubble pre code{background:none;color:#e8e4de;padding:0}
        .md-bubble a{color:#c4103a;text-decoration:none;word-wrap:anywhere}
        .md-bubble a:hover{text-decoration:underline}
        .md-bubble blockquote{border-left:3px solid #e8e2da;margin:8px 0;padding:4px 12px;color:#6b6560;font-style:italic}
        .md-bubble table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0;border-radius:8px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,0.09)}
        .md-bubble th{background:#f5f0eb;font-weight:700;text-align:left;padding:7px 10px;border-bottom:1px solid #e8e2da;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:#1a1916}
        .md-bubble td{padding:6px 10px;border-bottom:1px solid #f0ebe4;color:#2e2a26;vertical-align:top}
        .md-bubble tr:last-child td{border-bottom:none}.md-bubble tr:nth-child(even) td{background:#faf7f4}
        @keyframes caretBlink{0%,100%{opacity:1}50%{opacity:0}}
        .streaming-caret{display:inline-block;width:2px;height:1em;background:#1a1916;margin-left:2px;vertical-align:text-bottom;animation:caretBlink .9s ease-in-out infinite}
      `}</style>
      <div ref={ref} className="md-bubble" />
      {showCaret && <span className="streaming-caret" />}
    </>
  );
}

// Banner shown while sources are being processed
function ProcessingBanner() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 11px", background:"#faf7f4", borderRadius:8, border:"1px solid #f0ebe4" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.proc-spin{animation:spin 1s linear infinite}`}</style>
      <svg className="proc-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4bdb5" strokeWidth="2.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span style={{ fontSize:12, color:"#a09b94" }}>Gathering sources…</span>
    </div>
  );
}

// Copy button — shown on hover via CSS
function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }
  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy response"}
      className="copy-btn"
      style={{
        position:"absolute", bottom:8, right:8,
        width:24, height:24, borderRadius:6,
        border:"1px solid rgba(0,0,0,0.09)",
        background: copied ? "#fdf0f3" : "rgba(248,244,240,0.95)",
        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 1px 3px rgba(0,0,0,0.07)",
        transition:"opacity .15s, background .15s",
      }}
    >
      {copied ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c4103a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a09b94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
    </button>
  );
}

// Feedback row — controlled by parent via vote state
type VoteState = "idle" | "liked" | "disliked";

function FeedbackRow({
  vote,
  onVote,
  onContactSupport,
}: {
  vote: VoteState;
  onVote: (liked: boolean) => void;
  onContactSupport: () => void;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {/* Label — only before voting */}
        {vote === "idle" && (
          <span style={{ fontSize:13, color:"#6b6560" }}>Was this answer helpful?</span>
        )}

        {/* Like button — always shown unless disliked */}
        {vote !== "disliked" && (
          <div className={vote === "liked" ? "vote-tooltip-wrap" : undefined}>
            {vote === "liked" && (
              <span className="vote-tooltip">You liked this response</span>
            )}
            <button
              onClick={() => onVote(true)}
              disabled={vote !== "idle"}
              title="Helpful"
              style={{
                width:32, height:32, borderRadius:8,
                border: vote === "liked" ? "1.5px solid #c4103a" : "1px solid #e8e2da",
                background: vote === "liked" ? "#fdf0f3" : "#fff",
                cursor: vote === "idle" ? "pointer" : "default",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .15s", flexShrink:0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24"
                fill={vote === "liked" ? "#c4103a" : "none"}
                stroke={vote === "liked" ? "#c4103a" : "#6b6560"}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </button>
          </div>
        )}

        {/* Dislike button — always shown unless liked */}
        {vote !== "liked" && (
          <div className={vote === "disliked" ? "vote-tooltip-wrap" : undefined}>
            {vote === "disliked" && (
              <span className="vote-tooltip">You disliked this response</span>
            )}
            <button
              onClick={() => onVote(false)}
              disabled={vote !== "idle"}
              title="Not helpful"
              style={{
                width:32, height:32, borderRadius:8,
                border: vote === "disliked" ? "1.5px solid #c4103a" : "1px solid #e8e2da",
                background: vote === "disliked" ? "#fdf0f3" : "#fff",
                cursor: vote === "idle" ? "pointer" : "default",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .15s", flexShrink:0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24"
                fill={vote === "disliked" ? "#c4103a" : "none"}
                stroke={vote === "disliked" ? "#c4103a" : "#6b6560"}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Create support ticket — only before voting */}
      {vote === "idle" && (
        <button onClick={onContactSupport} style={{
          background:"none", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", gap:4,
          padding:0, fontSize:13, color:"#c4103a", fontFamily:"inherit",
          width:"fit-content",
        }}>
          Create support ticket
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// Acknowledgement bubble after user feedback
function AckBubble({ liked }: { liked: boolean }) {
  const text = liked
    ? "Glad I could help! Feel free to ask me anything else."
    : "Sorry I couldn't be more helpful this time. Try rephrasing your question — I'll do my best to assist you better.";
  return (
    <div
      className="chat-bubble"
      style={{ display:"flex", flexDirection:"row", alignItems:"flex-end", gap:8, padding:"2px 0" }}
    >
      <BotAvatar />
      <div style={{
        maxWidth:"74%", padding:"11px 15px",
        borderRadius:"16px 16px 16px 4px",
        background:"#ffffff", color:"#1a1916",
        fontSize:14, lineHeight:1.6,
        boxShadow:"0 1px 4px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.05)",
        wordBreak:"break-word",
      }}>
        {text}
      </div>
    </div>
  );
}

// Main ChatMessage component
interface Props {
  message: ChatMessageType;
  showAvatar: boolean;
  hasNewerMessage: boolean;
  onPromptbackClick?: (question: string) => void;
  onFeedback?: (payload: FeedbackPayload) => void;
  onContactSupport?: () => void;
  onHeightChange?: () => void; // fired when bubble grows — parent should scroll
}

export default function ChatMessage({
  message, showAvatar, hasNewerMessage,
  onPromptbackClick, onFeedback, onContactSupport, onHeightChange,
}: Props) {
  const isUser = message.sender === "user";
  const uniqueSources = dedupeByLink(message.sources);
  const hasSources = !isUser && uniqueSources.length > 0;
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Processing banner — only after 5s of isProcessingMeta
  const [showProcessing, setShowProcessing] = useState(false);
  const procTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (message.isProcessingMeta && !procTimer.current) {
      procTimer.current = setTimeout(() => setShowProcessing(true), 5000);
    }
    if (!message.isProcessingMeta) {
      if (procTimer.current) { clearTimeout(procTimer.current); procTimer.current = null; }
      setShowProcessing(false);
    }
  }, [message.isProcessingMeta]);

  // Single source of truth for vote — lives here, never in a child
  const [vote, setVote] = useState<VoteState>("idle");
  const voted = vote !== "idle";

  // ackLiked is set shortly after voting to trigger the ack bubble
  const [ackLiked, setAckLiked] = useState<boolean | null>(null);

  function handleVote(liked: boolean) {
    if (vote !== "idle") return;
    setVote(liked ? "liked" : "disliked");
    if (onFeedback && message.responseId) {
      onFeedback({ responseId: message.responseId, queryId: message.queryId, liked });
    }
    setTimeout(() => {
      setAckLiked(liked);
      onHeightChange?.();
    }, 620); // slightly after state settles
  }

  // suggestsDismissed controls slide-out of suggested questions only
  const [suggestsDismissed, setSuggestsDismissed] = useState(false);
  useEffect(() => { if (hasNewerMessage) setSuggestsDismissed(true); }, [hasNewerMessage]);

  const isDone = !isUser && !message.isStreaming && !message.isProcessingMeta;
  const rawPromptbacks = isDone ? (message.promptbackQuestions ?? []) : [];

  // Fire scroll when sources/promptbacks arrive (bubble grows taller)
  const prevHadSources = useRef(false);
  useEffect(() => {
    if (hasSources && !prevHadSources.current) {
      prevHadSources.current = true;
      onHeightChange?.();
    }
  }, [hasSources, onHeightChange]);

  // Fire scroll when isDone (streaming ends — bottom extras appear)
  const prevIsDone = useRef(false);
  useEffect(() => {
    if (isDone && !prevIsDone.current) {
      prevIsDone.current = true;
      onHeightChange?.();
    }
  }, [isDone, onHeightChange]);

  // Suppress avatar on main bubble when ack bubble is present
  // (ack bubble is visually last in the cluster and owns the avatar)
  const mainBubbleShowAvatar = showAvatar && ackLiked === null;

  function handlePromptbackClick(q: string) {
    setSuggestsDismissed(true);
    onPromptbackClick?.(q);
  }

  function getPlainText(): string {
    if (bubbleRef.current) {
      const d = bubbleRef.current.querySelector(".md-bubble");
      return d ? (d as HTMLElement).innerText : message.text;
    }
    return message.text;
  }

  return (
    <>
      <style>{`
        @keyframes msgIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes extrasIn{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideOut{from{opacity:1;transform:translateY(0);max-height:400px}to{opacity:0;transform:translateY(-6px);max-height:0}}
        .chat-bubble{animation:msgIn .2s ease forwards}
        .extras-in{animation:extrasIn .22s ease forwards}
        .slide-out{animation:slideOut .22s ease forwards;overflow:hidden;pointer-events:none}
        .bubble-wrap .copy-btn { opacity: 0; }
        .bubble-wrap:hover .copy-btn { opacity: 1; }
        .source-link{display:flex;align-items:flex-start;gap:6px;color:#c4103a;text-decoration:none;font-size:12px;line-height:1.45;padding:2px 0;transition:color .15s}
        .source-link:hover{color:#8b0a28;text-decoration:underline}
        .promptback-btn{display:flex;align-items:flex-start;gap:8px;width:100%;text-align:left;background:#faf7f4;border:1px solid #b0a89e;border-radius:10px;padding:9px 12px;font-size:13px;line-height:1.45;color:#6b6560;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s,color .15s}
        .promptback-btn:hover{background:#f5ede6;border-color:#c4103a;color:#c4103a}
        .promptback-btn:active{opacity:.85}
        .bubble-voted-liked{background:linear-gradient(180deg,rgba(34,197,94,0.045) 0%,rgba(255,255,255,1) 60%) !important;transition:background .4s ease}
        .bubble-voted-disliked{background:linear-gradient(180deg,rgba(239,68,68,0.045) 0%,rgba(255,255,255,1) 60%) !important;transition:background .4s ease}
        .vote-tooltip-wrap{position:relative;display:inline-flex}
        .vote-tooltip{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#1a1916;color:#fff;font-size:11px;line-height:1.4;white-space:nowrap;padding:5px 9px;border-radius:6px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:10}
        .vote-tooltip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:4px solid transparent;border-top-color:#1a1916}
        .vote-tooltip-wrap:hover .vote-tooltip{opacity:1}
      `}</style>

      {/* Main bubble row */}
      <div className="chat-bubble" style={{ display:"flex", flexDirection:isUser?"row-reverse":"row", alignItems:"flex-end", gap:8, padding:"2px 0" }}>
        {mainBubbleShowAvatar
          ? (isUser ? <UserAvatar /> : <BotAvatar />)
          : <Gutter />
        }

        <div ref={bubbleRef} className="bubble-wrap" style={{ maxWidth:"74%", position:"relative" }}>
          <div style={{
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isUser ? "linear-gradient(135deg,#c4103a 0%,#8b0a28 100%)" : "#ffffff",
            color: isUser ? "#ffffff" : "#1a1916",
            boxShadow: isUser ? "0 2px 12px rgba(196,16,58,0.28)" : "0 1px 4px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.05)",
            overflow:"hidden",
          }}
          className={!isUser && vote === "liked" ? "bubble-voted-liked" : !isUser && vote === "disliked" ? "bubble-voted-disliked" : undefined}
          >
            <div style={{ padding: isUser ? "10px 14px" : "11px 42px 11px 15px" }}>
              {isUser ? (
                <span style={{ fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{message.text}</span>
              ) : (
                <MarkdownBubble text={message.text} isStreaming={message.isStreaming} isProcessingMeta={message.isProcessingMeta} />
              )}
            </div>

            {!isUser && showProcessing && (
              <div style={{ padding:"0 15px 10px" }}>
                <ProcessingBanner />
              </div>
            )}

            {hasSources && (
              <div className="extras-in" style={{ borderTop:"1px solid rgba(0,0,0,0.07)", padding:"8px 15px 11px" }}>
                <p style={{ margin:"0 0 5px", fontSize:11, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"#a09b94" }}>
                  Related reading
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {uniqueSources.map((src, i) => (
                    <a key={i} href={src.link} target="_blank" rel="noopener noreferrer" className="source-link">
                      <svg style={{ flexShrink:0, marginTop:2, opacity:.65 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      {src.file_name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isUser && (
            <CopyButton getText={getPlainText} />
          )}
        </div>
      </div>

      {/* Below-bubble extras:
          - Feedback row is its own persistent block
          - Suggestions are a separate block that can slide out
          - Ack bubble is persistent once shown
        */}
      {isDone && (
        <>
          {/* Feedback row: visible when voted OR when not yet dismissed */}
          {(voted || !suggestsDismissed) && (
            <div
              className="extras-in"
              style={{ display:"flex", flexDirection:"row", gap:8, padding:"5px 0 2px" }}
            >
              <Gutter />
              <div style={{ maxWidth:"74%" }}>
                <FeedbackRow
                  vote={vote}
                  onVote={handleVote}
                  onContactSupport={() => onContactSupport?.()}
                />
              </div>
            </div>
          )}

          {/* Suggested questions — their own dismissible block */}
          {rawPromptbacks.length > 0 && (
            <div
              className={suggestsDismissed ? "slide-out" : "extras-in"}
              style={{ display:"flex", flexDirection:"row", gap:8, padding:"3px 0 2px" }}
            >
              <Gutter />
              <div style={{ maxWidth:"74%", display:"flex", flexDirection:"column", gap:7 }}>
                <p style={{ margin:"0 0 3px", fontSize:11, fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", color:"#b8b2ab", paddingLeft:2 }}>
                  You may be interested in
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:5, alignItems:"flex-start" }}>
                  {rawPromptbacks.slice(0, 3).map((q, i) => (
                    <button key={i} className="promptback-btn" onClick={() => handlePromptbackClick(q)}>
                      <svg style={{flexShrink:0,marginTop:2,opacity:.5}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Persistent ack bubble with avatar — never dismissed */}
          {ackLiked !== null && (
            <AckBubble liked={ackLiked} />
          )}
        </>
      )}
    </>
  );
}