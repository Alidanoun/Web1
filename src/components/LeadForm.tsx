"use client";

import { useState } from "react";

export default function LeadForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("الرجاء إدخال الاسم الكريم.");
      return;
    }

    if (!contact.trim()) {
      setError("الرجاء إدخال رقم الهاتف.");
      return;
    }

    // Phone validation (digits, spaces, plus, dashes)
    const phoneRegex = /^[\d\s+\-()]{7,15}$/;
    if (!phoneRegex.test(contact)) {
      setError("الرجاء إدخال رقم هاتف صالح (مثل 079xxxxxxx).");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.promoCode) {
        setPromoCode(data.promoCode);
      } else {
        setError(data.error || "حدث خطأ ما، يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      console.error("Error submitting lead:", err);
      setError("فشل الاتصال بالخادم، يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  const fallbackCopy = () => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = promoCode;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setError("يرجى نسخ الكود يدوياً.");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      setError("يرجى نسخ الكود يدوياً.");
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promoCode)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Clipboard copy failed, using fallback:", err);
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
  };

  return (
    <div className="card" style={{ border: "1px dashed rgba(223, 138, 39, 0.4)" }}>
      {promoCode ? (
        <div className="animate-fade-in" style={{ textAlign: "center", padding: "0.5rem 0" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎁</div>
          <h4 style={{ fontWeight: 800, marginBottom: "0.25rem", color: "var(--color-brand-gold)" }}>
            أهلاً بك {name}! لقد حصلت على مكافأتك
          </h4>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
            استخدم هذا الكوبون عند طلبك القادم للحصول على خصم مميز:
          </p>

          <div
            style={{
              border: "2px dashed var(--color-brand-gold)",
              borderRadius: "10px",
              padding: "0.75rem",
              background: "#1c1208",
              fontSize: "1.2rem",
              fontWeight: 800,
              letterSpacing: "1px",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              direction: "ltr",
            }}
          >
            <span style={{ marginLeft: "1rem" }}>{promoCode}</span>
            <button
              onClick={handleCopy}
              style={{
                background: "var(--color-brand-gold)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "0.35rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
              }}
            >
              {copied ? "تم النسخ!" : "نسخ الكود"}
            </button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            يصلك رمز الخصم أيضاً عبر رقم هاتفك المسجل ({contact}) قريباً.
          </p>
        </div>
      ) : (
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: "0.35rem", fontSize: "1.05rem" }}>
            🎁 احصل على مكافأة مميزة وخصم فوري!
          </h4>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
            أدخل اسمك ورقم هاتفك لتتلقى كوبون الخصم الحصري لعملاء ملاحم المركزية.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Input 1: Customer Name */}
            <div className="form-group">
              <label className="form-label">الاسم الكريم:</label>
              <input
                type="text"
                className="form-input"
                placeholder="أدخل اسمك الكريم (مثال: أسامة عبدالله)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Input 2: Phone Number */}
            <div className="form-group">
              <label className="form-label">رقم الهاتف:</label>
              <input
                type="tel"
                className="form-input"
                placeholder="رقم الهاتف (مثل 079xxxxxxx)"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <p
                style={{
                  color: "var(--color-danger)",
                  fontSize: "0.8rem",
                  marginBottom: "0.75rem",
                  fontWeight: 600,
                }}
              >
                ⚠ {error}
              </p>
            )}

            <button type="submit" className="btn-gold" disabled={loading} style={{ marginTop: "0.25rem" }}>
              {loading ? "جاري إرسال الكود..." : "احصل على مكافأتك الآن"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
