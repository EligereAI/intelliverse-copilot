"use client";

import { useState } from "react";

interface Props {
  companyId: string;
  onClose: () => void;
}

export default function ContactFormModal({ companyId, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Replace with your actual endpoint
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <>
      <style>{`
        @keyframes backdropIn { from{opacity:0} to{opacity:1} }
        @keyframes modalIn { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .contact-backdrop {
          position:fixed; inset:0; z-index:1000;
          background:rgba(26,25,22,0.45); backdrop-filter:blur(3px);
          display:flex; align-items:center; justify-content:center;
          animation:backdropIn .18s ease;
        }
        .contact-modal {
          background:#fff; border-radius:20px;
          width:min(420px, calc(100vw - 32px));
          box-shadow:0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
          animation:modalIn .22s ease;
          overflow:hidden;
        }
        .contact-field {
          width:100%; box-sizing:border-box;
          border:1.5px solid #e8e2da; border-radius:10px;
          padding:10px 13px; font-size:13.5px; font-family:inherit;
          color:#1a1916; background:#faf7f4;
          outline:none; transition:border-color .15s, background .15s;
          resize:none;
        }
        .contact-field:focus { border-color:#c4103a; background:#fff; }
        .contact-field::placeholder { color:#bbb6af; }
        .contact-submit {
          width:100%; padding:11px; border:none; border-radius:10px;
          background:linear-gradient(135deg,#c4103a 0%,#8b0a28 100%);
          color:#fff; font-size:14px; font-weight:600; font-family:inherit;
          cursor:pointer; transition:opacity .15s, transform .1s;
          box-shadow:0 4px 14px rgba(196,16,58,0.3);
        }
        .contact-submit:hover  { opacity:.92; }
        .contact-submit:active { transform:scale(.98); }
        .contact-submit:disabled { opacity:.55; cursor:not-allowed; }
      `}</style>

      <div className="contact-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="contact-modal">
          {/* Header */}
          <div style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #f0ebe4",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "#1a1916" }}>
                How can we help?
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a09b94" }}>
                Fill in your details — we&apos;ll get back to you shortly.
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "#f5f0eb", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "background .15s",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b6560" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "18px 20px 20px" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "linear-gradient(135deg,#c4103a 0%,#8b0a28 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px",
                  boxShadow: "0 4px 14px rgba(196,16,58,0.3)",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1a1916" }}>Message sent!</p>
                <p style={{ margin: 0, fontSize: 13, color: "#a09b94" }}>We&apos;ll be in touch soon.</p>
                <button onClick={onClose} style={{
                  marginTop: 18, padding: "9px 24px", borderRadius: 10,
                  border: "1px solid #e8e2da", background: "#fff",
                  fontSize: 13, fontWeight: 600, color: "#1a1916",
                  cursor: "pointer",
                }}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input type="hidden" name="company_id" value={companyId} />
                <input
                  className="contact-field"
                  type="text" name="name" required
                  placeholder="Your name"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="contact-field"
                  type="email" name="email" required
                  placeholder="Email address"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <textarea
                  className="contact-field"
                  name="message" rows={4}
                  placeholder="How can we help you?"
                  maxLength={1000}
                  value={message} onChange={(e) => setMessage(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "#c4bdb5" }}>{message.length}/1000</span>
                </div>
                <button
                  className="contact-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}