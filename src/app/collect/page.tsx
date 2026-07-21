"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoyaltyCollectPage() {
  const [points, setPoints] = useState<number | null>(null);
  const [status, setStatus] = useState<"success" | "cooldown" | "max">("success");
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  useEffect(() => {
    // 1. Get current loyalty points
    const savedPointsStr = localStorage.getItem("markzia_loyalty_points");
    let currentPoints = savedPointsStr ? parseInt(savedPointsStr, 10) : 0;

    // 2. Check last scan time (2-minute cooldown to prevent cheating/spamming)
    const lastScanStr = localStorage.getItem("markzia_last_scan_time");
    const lastScanTime = lastScanStr ? parseInt(lastScanStr, 10) : 0;
    const now = Date.now();
    const cooldownMs = 120000; // 2 minutes

    if (currentPoints >= 10) {
      setStatus("max");
      setPoints(10);
      return;
    }

    if (now - lastScanTime < cooldownMs) {
      setStatus("cooldown");
      setPoints(currentPoints);
      const remainingSeconds = Math.ceil((cooldownMs - (now - lastScanTime)) / 1000);
      setCooldownRemaining(remainingSeconds);
      return;
    }

    // 3. Award new point
    const newPoints = Math.min(currentPoints + 1, 10);
    localStorage.setItem("markzia_loyalty_points", newPoints.toString());
    localStorage.setItem("markzia_last_scan_time", now.toString());
    setPoints(newPoints);

    if (newPoints >= 10) {
      setStatus("max");
    } else {
      setStatus("success");
    }
  }, []);

  // Timer for cooldown countdown if applicable
  useEffect(() => {
    if (status !== "cooldown" || cooldownRemaining <= 0) return;
    const timer = setTimeout(() => {
      setCooldownRemaining(cooldownRemaining - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [status, cooldownRemaining]);

  if (points === null) {
    return (
      <div className="container" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <p style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>جاري تسجيل نقطتك... 🦁</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "480px", paddingTop: "3rem" }}>
      {/* Brand Header */}
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div className="logo-container">
          <div className="logo-ring-outer" />
          <div className="logo-ring-inner" />
          <div className="logo-image">
            <img src="/logo.jpg" alt="شعار ملاحم المركزية" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", marginTop: "1rem" }}>
          ملاحم ومطاعم المركزية
        </h2>
      </header>

      {/* Main Status Card */}
      <main className="card" style={{ border: "1px solid var(--color-brand-gold)", textAlign: "center", padding: "2rem 1.5rem" }}>
        
        {status === "success" && (
          <div className="animate-slide-up">
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem" }}>🎉</span>
            <h3 style={{ color: "var(--color-success)", fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              تم تسجيل النقطة بنجاح!
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-light)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              نشكرك على ثقتك واختيارك لملاحم المركزية. تم إضافة نقطة ولاء جديدة لبطاقتك الرقمية!
            </p>
          </div>
        )}

        {status === "cooldown" && (
          <div className="animate-slide-up">
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem" }}>⏳</span>
            <h3 style={{ color: "var(--color-brand-gold)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "0.5rem" }}>
              نقطتك مسجلة مسبقاً!
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              تم احتساب نقطتك السابقة بنجاح. لمنع التكرار، يرجى الانتظار قليلاً قبل مسح الرمز مرة أخرى.
              {cooldownRemaining > 0 && (
                <span style={{ display: "block", marginTop: "0.5rem", fontWeight: 700, color: "white" }}>
                  الوقت المتبقي للمسح القادم: {cooldownRemaining} ثانية
                </span>
              )}
            </p>
          </div>
        )}

        {status === "max" && (
          <div className="animate-slide-up">
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem" }}>🏆</span>
            <h3 style={{ color: "var(--color-success)", fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              المكافأة جاهزة للاستخدام!
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-light)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              لقد أكملت جمع 10 نقاط بنجاح! تفضل بإبراز الكود التالي للمحاسب في الملحمة للحصول على خصمك الفوري.
            </p>
            <div
              style={{
                background: "var(--color-success)",
                color: "white",
                padding: "0.75rem",
                borderRadius: "8px",
                fontWeight: 900,
                fontSize: "1.1rem",
                letterSpacing: "1.5px",
                marginBottom: "1.5rem",
                boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)",
              }}
            >
              LOYALTY-15-CLAIMED
            </div>
          </div>
        )}

        {/* Progress Bar Display */}
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "1.25rem 1rem", borderRadius: "10px", border: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            <span>رصيد نقاطك الحالي:</span>
            <span style={{ color: "var(--color-brand-gold)" }}>{points} / 10 نقاط</span>
          </div>
          
          <div style={{ width: "100%", height: "12px", background: "#222", borderRadius: "6px", overflow: "hidden", border: "1px solid #333" }}>
            <div
              style={{
                width: `${(points / 10) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--color-brand-gold) 0%, #ffc107 100%)",
                borderRadius: "6px",
                transition: "width 1s ease",
              }}
            />
          </div>
          {points < 10 && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem", textAlign: "right" }}>
              💡 متبقي {10 - points} نقاط للحصول على خصم 15% على فاتورتك القادمة.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link href="/" className="btn-gold" style={{ display: "block", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, padding: "0.75rem" }}>
            🍽️ تصفح وصفات المأكولات واللحوم
          </Link>
          
          {status === "max" && (
            <button
              onClick={() => {
                if (confirm("هل تريد بالتأكيد إعادة تصفير رصيد نقاطك والبدء من جديد؟")) {
                  localStorage.setItem("markzia_loyalty_points", "0");
                  setPoints(0);
                  setStatus("success");
                }
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--color-text-muted)",
                padding: "0.5rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              🔄 تصفير البطاقة (بعد استخدام الخصم)
            </button>
          )}
        </div>
      </main>

      <footer style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        <p>&copy; {new Date().getFullYear()} مطاعم وملاحم المركزية. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
