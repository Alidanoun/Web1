"use client";

import { useState } from "react";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import ScanTracker from "@/components/ScanTracker";

interface CategoryRecipe {
  id: string;
  title: string;
  category: string;
  cuisine: "arabic" | "international";
  desc: string;
  icon: string;
}

export default function HomePage() {
  const [selectedCuisine, setSelectedCuisine] = useState<"all" | "arabic" | "international">("all");

  const allRecipes: CategoryRecipe[] = [
    // === Arabic Recipes ===
    {
      id: "kebab",
      title: "كباب المركزية المشوي بالخلطة السرية",
      category: "كباب ومشاوي",
      cuisine: "arabic",
      desc: "الكباب العربي التقليدي المجهز من لحم الغنم البلدي الطازج والمشوي على الفحم",
      icon: "🔥",
    },
    {
      id: "ribs",
      title: "ريش الغنم المتبلة والمشوية",
      category: "ريش ومشويات",
      cuisine: "arabic",
      desc: "ريش غنم طرية وغنية بالنكهة مشوية بتتبيلة زيت الزيتون والروزماري والعشب العربي",
      icon: "🍖",
    },
    {
      id: "kofta",
      title: "كفتة بلدي بالصحن والطحينية",
      category: "صواني شرقية",
      cuisine: "arabic",
      desc: "طبق الكفتة الشرقي الأصيل المخبوز بالفرن مع البطاطس وصلصة الطحينية الكريمية",
      icon: "🥘",
    },
    {
      id: "awsal",
      title: "أوصال لحم شقف بلدي مشوية",
      category: "مشاوي عربية",
      cuisine: "arabic",
      desc: "قطع لحم بلدي طرية متبلة بعصير البصل والخل ومشوية على أسياخ الفحم",
      icon: "🍢",
    },

    // === International Recipes ===
    {
      id: "steak",
      title: "ستيك ريب آي (Ribeye) بالزبدة والأعشاب",
      category: "ستيك فاخر",
      cuisine: "international",
      desc: "الستيك الأكثر غنى بالنكهة والطراوة بأسلوب السفع (Searing) والترطيب بالزبدة",
      icon: "🥩",
    },
    {
      id: "tenderloin",
      title: "ستيك التندرلوين بصلصة المشروم",
      category: "ستيك فاخر",
      cuisine: "international",
      desc: "أطرى قطعة لحم ذائبة (الفيليه) مع صلصة الفطر والكريمة الغنية",
      icon: "🍽️",
    },
    {
      id: "burger",
      title: "برغر المركزية الفاخر بالجبنة البريوش",
      category: "برغر عالمي",
      cuisine: "international",
      desc: "أسرار كبس وشوي برغر اللحم البقري الطازج بالمنزل بأسلوب المطاعم الفاخرة",
      icon: "🍔",
    },
    {
      id: "smash",
      title: "برغر السماش المقرمش بالجبنة المزدوجة",
      category: "برغر عالمي",
      cuisine: "international",
      desc: "أقراص البرغر الرقيقة المكبوسة بقوة للحصول على حواف مقرمشة ومكرملة",
      icon: "🧀",
    },
  ];

  const filteredRecipes = selectedCuisine === "all"
    ? allRecipes
    : allRecipes.filter((r) => r.cuisine === selectedCuisine);

  return (
    <div className="container animate-fade-in">
      <ScanTracker productId="home" />
      {/* Brand Header */}
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        {/* Animated double ring logo */}
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
            marginBottom: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          مرحباً بك في عالم اللحوم
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--color-text-muted)",
            maxWidth: "420px",
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          اكتشف وصفات الطهي الاحترافية من مطاعم وملاحم المركزية مصنفة حسب ذوقك.
        </p>
      </header>

      {/* Main Categories Navigation Buttons (أزرار التصنيفات) */}
      <main>
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--color-brand-gold)",
              marginBottom: "0.75rem",
            }}
          >
            اختر التصنيف لعرض الوصفات:
          </h3>

          {/* Category Selector Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              className={`doneness-tab ${selectedCuisine === "all" ? "active" : ""}`}
              onClick={() => setSelectedCuisine("all")}
              style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
            >
              🍽️ جميع الوصفات ({allRecipes.length})
            </button>

            <button
              className={`doneness-tab ${selectedCuisine === "arabic" ? "active" : ""}`}
              onClick={() => setSelectedCuisine("arabic")}
              style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
            >
              🇦🇪 🇸🇦 الوصفات العربية والشرقية ({allRecipes.filter(r => r.cuisine === "arabic").length})
            </button>

            <button
              className={`doneness-tab ${selectedCuisine === "international" ? "active" : ""}`}
              onClick={() => setSelectedCuisine("international")}
              style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
            >
              🌎 الوصفات العالمية / الإنترناشيونال ({allRecipes.filter(r => r.cuisine === "international").length})
            </button>
          </div>
        </div>

        {/* Filtered Recipes Grid */}
        <div className="grid-categories" style={{ marginBottom: "2rem" }}>
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/${recipe.id}`}
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
                  <span style={{ fontSize: "2.2rem" }}>{recipe.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                      <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "white" }}>{recipe.title}</h4>
                      <span className="badge badge-gold" style={{ fontSize: "0.65rem" }}>
                        {recipe.cuisine === "arabic" ? "شرقي" : "عالمي"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      {recipe.desc}
                    </p>
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
              احرص على مسح رمز الـ QR الملصق على أطباق اللحوم الطازجة من ملاحمنا لجمع النقاط. كل مسح = نقطة واحدة. بعد 10 نقاط، ستحصل على خصم مجزي وتلقائي!
            </p>
          </div>
        </div>
      </main>

      {/* Footer & Admin Dashboard Access */}
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
