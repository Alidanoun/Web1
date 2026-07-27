"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ScanTracker from "@/components/ScanTracker";

type CardStatus = "loading" | "enter_phone" | "success" | "cooldown" | "max";

interface LoyaltyCard {
  phone: string;
  name: string;
  points: number;
  totalEarned: number;
  rewardCode: string;
  rewardUsed: boolean;
  lastScanAt?: string;
}

export default function LoyaltyCollectPage() {
  const [status, setStatus] = useState<CardStatus>("loading");
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remainingHours, setRemainingHours] = useState(0);
  const [copied, setCopied] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // On page load: check localStorage for cached phone to auto-resume
  useEffect(() => {
    const cachedPhone = localStorage.getItem("markzia_loyalty_phone");
    if (cachedPhone) {
      setPhone(cachedPhone);
      handleScan(cachedPhone, "");
    } else {
      setStatus("enter_phone");
    }
  }, []);

  async function handleScan(phoneNum: string, nameStr: string) {
    setStatus("loading");
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNum, name: nameStr, action: "scan" }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        // If cooldown
        if (data.status === "cooldown") {
          setCard(data.card);
          setRemainingHours(data.remainingHours ?? 12);
          setStatus("cooldown");
          localStorage.setItem("markzia_loyalty_phone", phoneNum);
          return;
        }
        setPhoneError(data.error ?? "حدث خطأ، حاول مجدداً");
        setStatus("enter_phone");
        return;
      }

      // Save phone to localStorage for next time
      localStorage.setItem("markzia_loyalty_phone", phoneNum);
      setCard(data.card);

      if (data.status === "max") {
        setStatus("max");
      } else if (data.status === "cooldown") {
        setRemainingHours(data.remainingHours ?? 12);
        setStatus("cooldown");
      } else {
        setStatus("success");
      }
    } catch (err) {
      // Network error fallback — try localStorage
      const cachedPhone = localStorage.getItem("markzia_loyalty_phone");
      const savedPoints = parseInt(localStorage.getItem("markzia_loyalty_points") || "0", 10);
      const lastScan = parseInt(localStorage.getItem("markzia_last_scan_time") || "0", 10);
      const now = Date.now();
      const cooldownMs = 12 * 3600 * 1000;

      if (lastScan && now - lastScan < cooldownMs) {
        setCard({ phone: phoneNum, name: nameStr, points: savedPoints, totalEarned: savedPoints, rewardCode: "", rewardUsed: false });
        setRemainingHours(Math.ceil((cooldownMs - (now - lastScan)) / 3600000));
        setStatus("cooldown");
        return;
      }

      const newPoints = Math.min(savedPoints + 1, 10);
      localStorage.setItem("markzia_loyalty_points", newPoints.toString());
      localStorage.setItem("markzia_last_scan_time", now.toString());
      setCard({ phone: phoneNum, name: nameStr, points: newPoints, totalEarned: newPoints, rewardCode: "", rewardUsed: false });
      setStatus(newPoints >= 10 ? "max" : "success");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 8) {
      setPhoneError("الرجاء إدخال رقم هاتف صحيح (8 أرقام على الأقل)");
      phoneInputRef.current?.focus();
      return;
    }
    setPhoneError("");
    setSubmitting(true);
    handleScan(phone.trim(), name.trim()).finally(() => setSubmitting(false));
  }

  function copyRewardCode() {
    if (!card?.rewardCode) return;
    navigator.clipboard.writeText(card.rewardCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleReset() {
    if (!confirm("هل أكدت استخدام الخصم مع موظف الملحمة وتريد إعادة تصفير البطاقة؟")) return;
    const phoneNum = card?.phone || phone;
    fetch("/api/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNum, action: "redeem" }),
    }).finally(() => {
      localStorage.setItem("markzia_loyalty_points", "0");
      setCard(null);
      setStatus("enter_phone");
    });
  }

  const progressPct = card ? Math.min((card.points / 10) * 100, 100) : 0;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "480px", paddingTop: "2.5rem" }}>
      <ScanTracker productId="loyalty" />

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div className="logo-container">
          <div className="logo-ring-outer" />
          <div className="logo-ring-inner" />
          <div className="logo-image">
            <img src="/logo.jpg" alt="شعار ملاحم المركزية" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", marginTop: "1rem", marginBottom: "0.25rem" }}>
          🦁 برنامج الولاء الرقمي
        </h1>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          ملاحم ومطاعم المركزية
        </p>
      </header>

      {/* ── LOADING ── */}
      {status === "loading" && (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⏳</div>
          <p style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>جاري تسجيل نقطتك...</p>
        </div>
      )}

      {/* ── PHONE ENTRY ── */}
      {status === "enter_phone" && (
        <div className="card animate-slide-up" style={{ border: "1px solid var(--color-brand-gold)", padding: "2rem 1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-brand-gold)", marginBottom: "0.4rem", textAlign: "center" }}>
            🎯 سجّل رقم هاتفك لجمع نقطتك
          </h2>
          <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textAlign: "center", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            أدخل رقم هاتفك لحفظ نقاطك بأمان. ستجمع نقطة في كل زيارة حتى تصل إلى 10 نقاط وتحصل على خصم 15%.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-light)", display: "block", marginBottom: "0.35rem" }}>
                📱 رقم الهاتف <span style={{ color: "var(--color-error, #f87171)" }}>*</span>
              </label>
              <input
                ref={phoneInputRef}
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                placeholder="مثال: 0501234567"
                inputMode="tel"
                dir="ltr"
                style={{ textAlign: "left" }}
                required
              />
              {phoneError && (
                <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.35rem", fontWeight: 600 }}>{phoneError}</p>
              )}
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-light)", display: "block", marginBottom: "0.35rem" }}>
                👤 الاسم (اختياري)
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك الكريم"
              />
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={submitting}
              style={{ marginTop: "0.25rem", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "⏳ جاري التسجيل..." : "🦁 تسجيل وجمع النقطة"}
            </button>
          </form>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {status === "success" && card && (
        <div className="card animate-slide-up" style={{ border: "1px solid var(--color-success)", padding: "2rem 1.5rem", textAlign: "center" }}>
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem" }}>🎉</span>
          <h2 style={{ color: "var(--color-success)", fontWeight: 800, fontSize: "1.3rem", marginBottom: "0.4rem" }}>
            تم تسجيل نقطتك بنجاح!
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-light)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            شكراً {card.name ? card.name : "لك"} على ثقتك في ملاحم المركزية! تمت إضافة نقطة جديدة لبطاقتك الرقمية.
          </p>
          {renderProgressBar(card, progressPct)}
          {renderActions()}
        </div>
      )}

      {/* ── COOLDOWN ── */}
      {status === "cooldown" && card && (
        <div className="card animate-slide-up" style={{ border: "1px solid rgba(223,138,39,0.4)", padding: "2rem 1.5rem", textAlign: "center" }}>
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem" }}>⏳</span>
          <h2 style={{ color: "var(--color-brand-gold)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "0.4rem" }}>
            نقطتك مسجلة مسبقاً!
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
            تم احتساب نقطتك. لمنع التكرار، يمكنك جمع نقطة جديدة مرة واحدة كل يوم فقط.
          </p>
          <div style={{ background: "rgba(223,138,39,0.1)", border: "1px solid rgba(223,138,39,0.3)", borderRadius: "8px", padding: "0.65rem", marginBottom: "1.5rem" }}>
            <span style={{ fontWeight: 700, color: "var(--color-brand-gold)", fontSize: "0.85rem" }}>
              ⏱️ متبقي {remainingHours} ساعة تقريباً للمسح القادم
            </span>
          </div>
          {renderProgressBar(card, progressPct)}
          {renderActions()}
        </div>
      )}

      {/* ── MAX (10 نقاط) ── */}
      {status === "max" && card && (
        <div className="card animate-slide-up" style={{ border: "2px solid var(--color-success)", padding: "2rem 1.5rem", textAlign: "center" }}>
          <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "0.5rem" }}>🏆</span>
          <h2 style={{ color: "var(--color-success)", fontWeight: 800, fontSize: "1.3rem", marginBottom: "0.4rem" }}>
            المكافأة جاهزة!
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-light)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
            {card.name ? `أحسنت ${card.name}! ` : ""}لقد أكملت جمع 10 نقاط بنجاح! أبرز الكود التالي لموظف الملحمة للحصول على خصم 15%.
          </p>

          {/* Reward Code Display */}
          <div
            onClick={copyRewardCode}
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
              border: "2px solid var(--color-success)",
              borderRadius: "12px",
              padding: "1.25rem",
              marginBottom: "1rem",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>كود الخصم الخاص بك:</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--color-success)", letterSpacing: "2px", fontFamily: "monospace" }}>
              {card.rewardCode || "LOYALTY-10PT"}
            </p>
            <p style={{ fontSize: "0.7rem", color: copied ? "var(--color-success)" : "var(--color-text-muted)", marginTop: "0.5rem", transition: "color 0.3s" }}>
              {copied ? "✅ تم النسخ!" : "👆 اضغط لنسخ الكود"}
            </p>
          </div>

          {renderProgressBar(card, 100)}

          {/* Redeem / Reset */}
          <button
            onClick={handleReset}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "var(--color-text-muted)",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              fontSize: "0.75rem",
              cursor: "pointer",
              width: "100%",
              marginTop: "0.5rem",
              fontFamily: "inherit",
            }}
          >
            🔄 استخدمت الخصم؟ اضغط هنا لبدء جمع نقاط جديدة
          </button>

          {renderActions()}
        </div>
      )}

      <footer style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        <p>© {new Date().getFullYear()} مطاعم وملاحم المركزية. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );

  function renderProgressBar(c: LoyaltyCard, pct: number) {
    return (
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid var(--color-border)", padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          <span>رصيد نقاطك:</span>
          <span style={{ color: "var(--color-brand-gold)" }}>{c.points} / 10 نقاط</span>
        </div>
        {/* Dots Row */}
        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", marginBottom: "0.6rem" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "clamp(20px, 8vw, 30px)",
                height: "clamp(20px, 8vw, 30px)",
                borderRadius: "50%",
                background: i < c.points
                  ? "linear-gradient(135deg, var(--color-brand-gold), #ffc107)"
                  : "rgba(255,255,255,0.06)",
                border: i < c.points ? "none" : "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                transition: "all 0.4s ease",
                boxShadow: i < c.points ? "0 0 6px rgba(223,138,39,0.5)" : "none",
              }}
            >
              {i < c.points ? "★" : ""}
            </div>
          ))}
        </div>
        {/* Progress Bar */}
        <div style={{ width: "100%", height: "8px", background: "#222", borderRadius: "4px", overflow: "hidden", border: "1px solid #333" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--color-brand-gold) 0%, #ffc107 100%)", borderRadius: "4px", transition: "width 1s ease" }} />
        </div>
        {c.points < 10 && (
          <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.45rem", textAlign: "right" }}>
            💡 متبقي {10 - c.points} نقاط للحصول على خصم 15%
          </p>
        )}
      </div>
    );
  }

  function renderActions() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.75rem" }}>
        <Link href="/" className="btn-gold" style={{ display: "block", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, padding: "0.75rem", textAlign: "center" }}>
          🍽️ تصفح وصفات اللحوم والدجاج
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem("markzia_loyalty_phone");
            setCard(null);
            setPhone("");
            setName("");
            setStatus("enter_phone");
          }}
          style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", fontSize: "0.72rem", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
        >
          تغيير رقم الهاتف
        </button>
      </div>
    );
  }
}
