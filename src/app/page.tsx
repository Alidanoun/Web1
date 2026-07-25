"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import ScanTracker from "@/components/ScanTracker";
import { recipes as staticRecipes } from "@/data/recipes";

// Force Vercel production rebuild with DATABASE_URL
interface DisplayRecipe {
  id: string;
  title: string;
  category: string;
  meatType: "meat" | "chicken";
  cuisine: "arabic" | "international";
  description: string;
  icon?: string;
}

export default function HomePage() {
  const [selectedMeatType, setSelectedMeatType] = useState<"all" | "meat" | "chicken">("meat");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [recipesList, setRecipesList] = useState<DisplayRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live recipes from database (with static fallback)
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.recipes) {
          const formatted: DisplayRecipe[] = Object.keys(data.recipes).map((key) => {
            const r = data.recipes[key];
            let icon = "🥩";
            if (r.meatType === "chicken") {
              icon = "🍗";
            } else if (r.category?.includes("برغر") || r.id?.includes("burger")) {
              icon = "🍔";
            } else if (r.category?.includes("كباب") || r.id?.includes("kebab")) {
              icon = "🔥";
            } else if (r.category?.includes("ريش") || r.id?.includes("ribs")) {
              icon = "🍖";
            } else if (r.category?.includes("كفتة") || r.id?.includes("kofta")) {
              icon = "🥘";
            }

            return {
              id: r.id,
              title: r.title,
              category: r.category || "عام",
              meatType: r.meatType || "meat",
              cuisine: r.cuisine || "arabic",
              description: r.description || "",
              icon,
            };
          });
          setRecipesList(formatted);
        } else {
          fallbackStatic();
        }
      })
      .catch((err) => {
        console.error("Failed to load recipes from API:", err);
        fallbackStatic();
      })
      .finally(() => setLoading(false));
  }, []);

  const fallbackStatic = () => {
    const formatted: DisplayRecipe[] = Object.keys(staticRecipes).map((key) => {
      const r = staticRecipes[key];
      let icon = r.meatType === "chicken" ? "🍗" : "🥩";
      if (r.category.includes("برغر") || r.id.includes("burger")) icon = "🍔";
      if (r.category.includes("كباب")) icon = "🔥";
      if (r.category.includes("ريش")) icon = "🍖";
      if (r.category.includes("كفتة")) icon = "🥘";
      return {
        id: r.id,
        title: r.title,
        category: r.category,
        meatType: r.meatType || "meat",
        cuisine: r.cuisine,
        description: r.description,
        icon,
      };
    });
    setRecipesList(formatted);
  };

  // 1. Filter by Meat Type (Meat vs Chicken vs All)
  const meatFiltered = selectedMeatType === "all"
    ? recipesList
    : recipesList.filter((r) => r.meatType === selectedMeatType);

  // 2. Extract available subcategories for current meat type selection
  const availableCategories = Array.from(
    new Set(meatFiltered.map((r) => r.category))
  );

  // 3. Filter by Subcategory if selected
  const finalFiltered = selectedCategory === "all"
    ? meatFiltered
    : meatFiltered.filter((r) => r.category === selectedCategory);

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
          ملاﺣﻢ ومطاعم المركزية
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
          اختر صنف اللحوم أو الدجاج المفضل لديك واكتشف أسرار تتبيل وطهي أصنافنا الفاخرة.
        </p>
      </header>

      {/* Main Meat vs Chicken Filter Tabs */}
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
            🎯 حدد صنف المشاوي والوصفات المطلوبة:
          </h3>

          {/* Primary Type Selection Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <button
              className={`doneness-tab ${selectedMeatType === "meat" ? "active" : ""}`}
              onClick={() => {
                setSelectedMeatType("meat");
                setSelectedCategory("all");
              }}
              style={{ padding: "0.65rem 1.35rem", fontSize: "0.95rem", fontWeight: 800 }}
            >
              🥩 قسم اللحوم الحمراء ({recipesList.filter(r => r.meatType === "meat").length})
            </button>

            <button
              className={`doneness-tab ${selectedMeatType === "chicken" ? "active" : ""}`}
              onClick={() => {
                setSelectedMeatType("chicken");
                setSelectedCategory("all");
              }}
              style={{ padding: "0.65rem 1.35rem", fontSize: "0.95rem", fontWeight: 800 }}
            >
              🍗 قسم الدجاج والطيور ({recipesList.filter(r => r.meatType === "chicken").length})
            </button>

            <button
              className={`doneness-tab ${selectedMeatType === "all" ? "active" : ""}`}
              onClick={() => {
                setSelectedMeatType("all");
                setSelectedCategory("all");
              }}
              style={{ padding: "0.65rem 1rem", fontSize: "0.85rem" }}
            >
              🌟 جميع الأصناف ({recipesList.length})
            </button>
          </div>

          {/* Secondary Subcategories Pills (إذا وُجدت) */}
          {availableCategories.length > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.4rem",
                flexWrap: "wrap",
                background: "rgba(255,255,255,0.03)",
                padding: "0.5rem",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.06)",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              <button
                onClick={() => setSelectedCategory("all")}
                style={{
                  background: selectedCategory === "all" ? "var(--color-brand-gold)" : "transparent",
                  color: selectedCategory === "all" ? "white" : "var(--color-text-muted)",
                  border: "none",
                  borderRadius: "20px",
                  padding: "0.3rem 0.85rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                الكل
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? "var(--color-brand-gold)" : "transparent",
                    color: selectedCategory === cat ? "white" : "var(--color-text-muted)",
                    border: "none",
                    borderRadius: "20px",
                    padding: "0.3rem 0.85rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recipes Grid */}
        <div className="grid-categories" style={{ marginBottom: "2rem" }}>
          {finalFiltered.map((recipe) => (
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
                  <span style={{ fontSize: "2.3rem" }}>{recipe.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                      <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "white" }}>{recipe.title}</h4>
                      <span className="badge badge-gold" style={{ fontSize: "0.65rem" }}>
                        {recipe.category}
                      </span>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          background: recipe.meatType === "chicken" ? "rgba(255, 193, 7, 0.2)" : "rgba(223, 138, 39, 0.2)",
                          color: recipe.meatType === "chicken" ? "#ffc107" : "var(--color-brand-gold)",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                          fontWeight: 700,
                        }}
                      >
                        {recipe.meatType === "chicken" ? "🍗 دجاج" : "🥩 لحم"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      {recipe.description}
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
