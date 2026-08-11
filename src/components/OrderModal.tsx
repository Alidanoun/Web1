"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface OrderModalProps {
  product: string;
}

export default function OrderModal({ product }: OrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOrderClick = (platform: string, url: string) => {
    // Open immediately in the user interaction thread to bypass mobile popup blockers
    window.open(url, "_blank");

    // Log the click in the background asynchronously
    fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, platform }),
    }).catch((error) => {
      console.error("Error logging click:", error);
    });
  };

  const phoneNum = process.env.NEXT_PUBLIC_CONTACT_PHONE || "065777999";

  const platforms = [
    {
      name: `رقم خدمة العملاء المباشر (${phoneNum})`,
      icon: "📞",
      description: "اتصل بنا هاتفياً لترتيب طلبك وتلبية طلباتك الخاصة",
      url: `tel:${phoneNum}`,
      key: "phone",
    },
  ];

  return (
    <div className="card" style={{ border: "1px solid rgba(223, 138, 39, 0.4)", textAlign: "center" }}>
      <h4 style={{ fontWeight: 800, marginBottom: "0.5rem", fontSize: "1.05rem" }}>
        🍔 لا ترغب بالطهي اليوم؟
      </h4>
      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
        جرب نفس هذه الوصفة محمرة ومجهزة بأيدي طهاتنا المحترفين في مطاعمنا!
      </p>

      <button className="btn-gold" onClick={() => setIsOpen(true)}>
        <span>🛒 اطلبها جاهزة الآن</span>
      </button>

      {mounted && isOpen ? createPortal(
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsOpen(false)}>
              &times;
            </button>

            <h3
              style={{
                fontWeight: 800,
                color: "var(--color-brand-gold)",
                marginBottom: "0.5rem",
                fontSize: "1.2rem",
                textAlign: "center",
              }}
            >
              الطلب المباشر
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-muted)",
                textAlign: "center",
                marginBottom: "1.25rem",
              }}
            >
              اتصل بنا مباشرة لطلب الوجبة جاهزة من مطاعم المركزية:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {platforms.map((platform) => (
                <div
                  key={platform.key}
                  onClick={() => handleOrderClick(platform.key, platform.url)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOrderClick(platform.key, platform.url);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    background: "rgba(223, 138, 39, 0.08)",
                    border: "1px solid var(--color-brand-gold)",
                    borderRadius: "14px",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    outline: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-brand-gold)";
                    e.currentTarget.style.background = "rgba(223, 138, 39, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-brand-gold)";
                    e.currentTarget.style.background = "rgba(223, 138, 39, 0.08)";
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>{platform.icon}</span>
                  <div style={{ textAlign: "right", minWidth: 0, flex: 1 }}>
                    <h5 style={{ fontWeight: 800, fontSize: "1rem", color: "white" }}>
                      {platform.name}
                    </h5>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-brand-gold)", fontWeight: 700, marginTop: "0.2rem" }}>
                      📞 {phoneNum}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                      {platform.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
