"use client";

import { useEffect, useState } from "react";

interface LoyaltyTrackerProps {
  product: string;
}

export default function LoyaltyTracker({ product }: LoyaltyTrackerProps) {
  const [points, setPoints] = useState(0);
  const [justEarned, setJustEarned] = useState(false);
  const [rewardUnlocked, setRewardUnlocked] = useState(false);

  useEffect(() => {
    // Get current loyalty points from localStorage
    const savedPointsStr = localStorage.getItem("markzia_loyalty_points");
    const currentPoints = savedPointsStr ? parseInt(savedPointsStr, 10) : 0;

    setPoints(currentPoints);

    if (currentPoints >= 10) {
      setRewardUnlocked(true);
    }
  }, [product]);

  const handleReset = () => {
    localStorage.setItem("markzia_loyalty_points", "0");
    setPoints(0);
    setRewardUnlocked(false);
    setJustEarned(false);
  };

  return (
    <div className="card" style={{ border: "1px solid rgba(223, 138, 39, 0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h4 style={{ fontWeight: 800, fontSize: "1.05rem" }}>🦁 برنامج الولاء لعملاء المركزية</h4>
        <span className="badge badge-gold">بطاقة رقمية</span>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
        في كل مرة تشتري فيها من ملحمتنا وتمسح رمز الـ QR الموجود على الطبق، تحصل على نقطة واحدة. اجمع 10 نقاط لتحصل على خصم فوري على مشترياتك القادمة!
      </p>

      {/* Progress Bar Container */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            fontWeight: 700,
            marginBottom: "0.35rem",
          }}
        >
          <span>النقاط المجمعة:</span>
          <span style={{ color: "var(--color-brand-gold)" }}>{points} / 10 نقاط</span>
        </div>

        {/* Progress Track */}
        <div
          style={{
            width: "100%",
            height: "12px",
            background: "#222",
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
            border: "1px solid #333",
          }}
        >
          <div
            style={{
              width: `${(points / 10) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, var(--color-brand-gold) 0%, #ffc107 100%)",
              borderRadius: "6px",
              transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 0 8px var(--color-brand-gold)",
            }}
          />
        </div>
      </div>



      {rewardUnlocked ? (
        <div
          className="animate-slide-up"
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid var(--color-success)",
            borderRadius: "10px",
            padding: "0.85rem",
            textAlign: "center",
            marginTop: "0.5rem",
          }}
        >
          <h5 style={{ color: "var(--color-success)", fontWeight: 700, marginBottom: "0.25rem" }}>
            🏆 تم فتح المكافأة الكبرى!
          </h5>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-light)", marginBottom: "0.75rem" }}>
            لقد أكملت 10 نقاط بنجاح! تفضل بزيارة الملحمة واعرض هذا الشعار للموظف للحصول على خصم 15% على مشترياتك.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div
              style={{
                background: "var(--color-success)",
                color: "white",
                padding: "0.5rem",
                borderRadius: "6px",
                fontWeight: 800,
                fontSize: "0.9rem",
                flex: 1,
                letterSpacing: "1px",
              }}
            >
              LOYALTY-15-CLAIMED
            </div>
            <button
              onClick={handleReset}
              style={{
                background: "transparent",
                border: "1px solid var(--color-success)",
                color: "var(--color-success)",
                borderRadius: "6px",
                padding: "0.5rem",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.75rem",
              }}
            >
              إعادة البدء
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          متبقي {10 - points} نقاط للحصول على خصم الولاء المميّز.
        </div>
      )}
    </div>
  );
}
