"use client";

import { useEffect, useState } from "react";

interface Package {
  id: string;
  name: string;
  description: string;
  kebab: string;
  ribs: string;
  burger: string;
  steak: string;
  notes: string;
}

export default function QuantityCalculator() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedId, setSelectedId] = useState("group-3"); // default to 3-5 people
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch("/api/packages");
        const data = await res.json();
        if (res.ok && data.packages) {
          setPackages(data.packages);
        }
      } catch (err) {
        console.error("Error loading packages:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  const activePkg = packages.find((p) => p.id === selectedId);

  // Generates custom WhatsApp message URL
  const getWhatsAppLink = (pkg: Package) => {
    const phoneNumber = "962799999999"; // Replace with Al-Markazia actual WhatsApp number if available
    const baseText = `مرحباً ملاحم ومطاعم المركزية، أود طلب باقة اللحوم الموصى بها:\n\n*الباقة:* ${pkg.name}\n`;
    let detailsText = "";
    if (pkg.kebab && pkg.kebab !== "—") detailsText += `- كباب بلدي: ${pkg.kebab}\n`;
    if (pkg.ribs && pkg.ribs !== "—") detailsText += `- ريش غنم بلدي: ${pkg.ribs}\n`;
    if (pkg.burger && pkg.burger !== "—") detailsText += `- برغر بلدي: ${pkg.burger}\n`;
    if (pkg.steak && pkg.steak !== "—") detailsText += `- ستيك ريب آي: ${pkg.steak}\n`;
    
    const footerText = `\nيرجى تأكيد الطلب وتحديد موعد الاستلام/التوصيل. شكراً لكم!`;
    const fullText = encodeURIComponent(baseText + detailsText + footerText);
    return `https://wa.me/${phoneNumber}?text=${fullText}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--color-brand-gold)" }}>
        <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>جاري تحميل باقات اللحوم... 🍖</span>
      </div>
    );
  }

  if (packages.length === 0) return null;

  return (
    <div className="card" style={{ border: "1px solid rgba(223, 138, 39, 0.3)", marginTop: "1rem", marginBottom: "2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <h3 style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-brand-gold)", marginBottom: "0.35rem" }}>
          🍖 حاسبة كميات اللحوم وباقات المركزية
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          اختر حجم جمعتكم أو عزومتكم واعرف كميات اللحوم الموصى بها والجاهزة للشواء فوراً!
        </p>
      </div>

      {/* Package Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.75rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid var(--color-border)",
          scrollbarWidth: "none",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedId(pkg.id)}
            className={`doneness-tab ${selectedId === pkg.id ? "active" : ""}`}
            style={{
              fontSize: "0.85rem",
              padding: "0.5rem 1rem",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {pkg.id === "group-1" ? "👤 شخص واحد" :
             pkg.id === "group-2" ? "👥 شخصين" :
             pkg.id === "group-3" ? "👨‍👩‍👦 3 - 5 أشخاص" :
             pkg.id === "group-4" ? "👨‍👩‍👧‍👦 5 - 7 أشخاص" : "👑 وليمة (8+)"}
          </button>
        ))}
      </div>

      {/* Package Contents Panel */}
      {activePkg && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: "1rem" }}>
            <h4 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", marginBottom: "0.25rem" }}>
              {activePkg.name}
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
              {activePkg.description}
            </p>
          </div>

          {/* Quantities breakdown */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <h5 style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--color-brand-gold)", marginBottom: "0.75rem" }}>
              📊 المكونات والكميات الموصى بها:
            </h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--color-border)", paddingBottom: "0.35rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>🍢 كباب بلدي:</span>
                <strong style={{ color: "white" }}>{activePkg.kebab || "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--color-border)", paddingBottom: "0.35rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>🍖 ريش بلدي:</span>
                <strong style={{ color: "white" }}>{activePkg.ribs || "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--color-border)", paddingBottom: "0.35rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>🍔 برغر بلدي:</span>
                <strong style={{ color: "white" }}>{activePkg.burger || "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--color-border)", paddingBottom: "0.35rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>🥩 ستيك ريب آي:</span>
                <strong style={{ color: "white" }}>{activePkg.steak || "—"}</strong>
              </div>
            </div>

            {activePkg.notes && (
              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)", fontSize: "0.8rem", color: "var(--color-text-muted)", display: "flex", alignItems: "flex-start", gap: "0.35rem" }}>
                <span>💡</span>
                <span>{activePkg.notes}</span>
              </div>
            )}
          </div>

          {/* Action Order Button */}
          <a
            href={getWhatsAppLink(activePkg)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 700,
              padding: "0.75rem",
            }}
          >
            💬 اطلب هذه الباقة الآن عبر الواتساب
          </a>
        </div>
      )}
    </div>
  );
}
