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

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promoCode)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = promoCode;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="card" style={{ border: "1px dashed rgba(223, 138, 39, 0.4)" }}>
      {promoCode ? (
        /* ✅ SUCCESS: رسالة التهنئة مع كود الخصم المخصص */
        <div className="animate-fade-in" style={{ textAlign: "center", padding: "1.25rem 0" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>🎉</div>
          <h3
            style={{
              fontWeight: 900,
              marginBottom: "0.75rem",
              color: "var(--color-brand-gold)",
              fontSize: "1.4rem",
              lineHeight: 1.5,
            }}
          >
            تهانينا! لقد حصلت على خصم خاص بك.
          </h3>

          {/* 🎟️ صندوق كود الخصم */}
          <div
            style={{
              border: "2px dashed var(--color-brand-gold)",
              borderRadius: "12px",
              padding: "0.85rem 1.25rem",
              background: "#1c1208",
              fontSize: "1.3rem",
              fontWeight: 900,
              letterSpacing: "2px",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "1.25rem auto",
              maxWidth: "340px",
              direction: "ltr",
            }}
          >
            <span style={{ color: "var(--color-brand-gold)", marginLeft: "0.5rem" }}>{promoCode}</span>
            <button
              onClick={handleCopy}
              type="button"
              style={{
                background: copied ? "var(--color-success)" : "var(--color-brand-gold)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.45rem 0.9rem",
                fontSize: "0.85rem",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
                transition: "all 0.2s ease",
              }}
            >
              {copied ? "تم النسخ! ✓" : "نسخ الكود"}
            </button>
          </div>

          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--color-text-muted)",
              marginBottom: "1.25rem",
              lineHeight: 1.9,
            }}
          >
            للاستفادة من الخصم، يرجى التواصل على الرقم{" "}
            <a
              href="tel:065777999"
              style={{
                color: "var(--color-brand-gold)",
                fontWeight: 900,
                textDecoration: "none",
                fontSize: "1.15rem",
              }}
            >
              065777999
            </a>{" "}
            وتنفيذ الطلب من خلاله وتزويدهم بكود الخصم للحصول على الخصم المخصص لك.
          </p>
          <p
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--color-text)",
              marginTop: "0.5rem",
            }}
          >
            نتمنى لكم تجربة مميزة! ✨
          </p>
        </div>
      ) : (
        /* 📝 FORM: نموذج إدخال البيانات */
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
