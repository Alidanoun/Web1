"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import ScanTracker from "@/components/ScanTracker";

interface Product {
  id: string;
  name: string;
  weight: string;
  icon: string;
  imageUrl?: string;
  sortOrder: number;
}

const STATIC_PRODUCTS: Product[] = [
  { id: "katef-kharouf", name: "كتف خاروف بلدي", weight: "", icon: "🐑", sortOrder: 1 },
  { id: "lahma-mafrouma-khashna", name: "لحمه مفرومه خشنه طازجه", weight: "", icon: "🥩", sortOrder: 2 },
  { id: "lahma-mafrouma-naema", name: "لحمه مفرومه ناعمه طازجه", weight: "", icon: "🥩", sortOrder: 3 },
  { id: "lahma-mafrouma-ejel", name: "لحمه مفرومه عجل مع خاروف بلدي طازج", weight: "", icon: "🥩", sortOrder: 4 },
  { id: "ras-asfour", name: "راس عصفور عجل طازج", weight: "", icon: "🍖", sortOrder: 5 },
  { id: "ribs", name: "ريش خارووف طازج", weight: "", icon: "🍖", sortOrder: 6 },
  { id: "burger", name: "برغر لحم طازج", weight: "", icon: "🍔", sortOrder: 7 },
  { id: "chinese", name: "تشاينيز عجل طازج", weight: "", icon: "🥘", sortOrder: 8 },
  { id: "ribeye-steak", name: "رب اي ستيك", weight: "", icon: "🥩", sortOrder: 9 },
  { id: "kofta", name: "كفته لحم عجل مع خروف", weight: "", icon: "🥘", sortOrder: 10 },
  { id: "filet-steak", name: "ستيك فيليه طازج", weight: "", icon: "🥩", sortOrder: 11 },
  { id: "liyeh", name: "ليه خاروف بلدي", weight: "", icon: "🐑", sortOrder: 12 },
  { id: "sausage", name: "سجق لحم بقري بلدي", weight: "", icon: "🌭", sortOrder: 13 },
  { id: "fakheth-kharouf", name: "فخذ خاروف بلدي", weight: "", icon: "🐑", sortOrder: 14 },
  { id: "adla3", name: "اضلاع خاروف بلدي", weight: "", icon: "🍖", sortOrder: 15 },
  { id: "burger-box", name: "برغر بوكس", weight: "", icon: "📦", sortOrder: 16 },
  { id: "shish-box", name: "شيش بوكس", weight: "", icon: "📦", sortOrder: 17 },
  { id: "kebab-box", name: "كباب بوكس", weight: "", icon: "📦", sortOrder: 18 },
];

export default function HomePage() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [settings, setSettings] = useState({
    siteTitle: "ملاحم ومطاعم المركزية",
    siteSubtitle: "اختر صنف اللحوم أو الدجاج المفضل لديك واكتشف أسرار تتبيل وطهي أصنافنا الفاخرة.",
  });

  useEffect(() => {
    // Fetch live settings from database
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
      })
      .catch((err) => console.error("Failed to load settings:", err));

    // Fetch live products from database (with static fallback)
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
        } else {
          setProductsList(STATIC_PRODUCTS);
        }
      })
      .catch((err) => {
        console.error("Failed to load products from API:", err);
        setProductsList(STATIC_PRODUCTS);
      });
  }, []);

  return (
    <div className="container animate-fade-in">
      <ScanTracker productId="home" />

      {/* Brand Header */}
      <header style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div className="logo-container">
          <div className="logo-ring-outer" />
          <div className="logo-ring-inner" />
          <div className="logo-image">
            <img
              src="/logo.jpg"
              alt="شعار مطاعم وملاحم المركزية"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            color: "white",
            marginBottom: "0.4rem",
            marginTop: "0.5rem",
          }}
        >
          {settings.siteTitle}
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--color-text-muted)",
            maxWidth: "420px",
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          {settings.siteSubtitle}
        </p>
      </header>

      <main>
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--color-brand-gold)",
              marginBottom: "0.75rem",
            }}
          >
            🎯 حدد صنف اللحوم لعرض وصفات التحضير:
          </h3>
        </div>

        {/* Products Grid */}
        <div className="grid-categories" style={{ marginBottom: "2rem" }}>
          {productsList.map((product) => (
            <Link
              key={product.id}
              href={`/${product.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
              className="card animate-slide-up"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", textAlign: "right" }}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid rgba(223, 138, 39, 0.3)",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "2.5rem", flexShrink: 0 }}>{product.icon}</span>
                  )}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                      <h4 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white" }}>{product.name}</h4>
                      {product.weight && (
                        <span className="badge badge-gold" style={{ fontSize: "0.7rem", marginTop: "0.2rem" }}>
                          {product.weight}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    color: "var(--color-brand-gold)",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                  }}
                >
                  ←
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Lead Form and Loyalty Card in Responsive Grid */}
        <div className="grid-two-column">
          <LeadForm />

          {/* Loyalty Program Info card */}
          <div className="card" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
            <h4 style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-brand-gold)", marginBottom: "0.5rem" }}>
              🦁 برنامج نقاط الولاء الرقمي
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-light)", lineHeight: 1.5 }}>
              احرص على مسح رمز الـ QR الملصق على أطباق اللحوم والدجاج الطازجة من ملاحمنا لجمع النقاط. كل مسح = نقطة واحدة. بعد 10 نقاط، ستحصل على خصم مجزي وتلقائي!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          marginTop: "3rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--color-border)",
          fontSize: "0.8rem",
          color: "var(--color-text-muted)",
        }}
      >
        <p style={{ marginBottom: "0.25rem" }}>تم إعداد هذه الوصفات بواسطة مطاعم وملاحم المركزية.</p>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.15)", marginBottom: "1.5rem" }}>
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
