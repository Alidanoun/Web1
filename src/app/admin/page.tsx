"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Lead {
  id: string;
  name: string;
  contact: string;
  promoCode: string;
  createdAt: string;
}

interface Scan {
  id: string;
  product: string;
  createdAt: string;
}

interface StatsData {
  scans: Record<string, number>;
  ratings: Record<string, { count: number; avg: number }>;
  leads: {
    total: number;
    recent: Lead[];
  };
  clicks: Record<string, number>;
  recentScans: Scan[];
  recentRatings?: any[];
}

interface RecipeData {
  id: string;
  title: string;
  category: string;
  meatType?: "meat" | "chicken";
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  videoPlaceholder: string;
  videoUrl?: string;
  icon?: string;
  ingredients: any;
  instructions: string[];
  tips: string[];
  marinade: string;
  cuisine?: string;
  recommendedWeights?: any;
}

interface PackageData {
  id: string;
  name: string;
  description: string;
  kebab: string;
  ribs: string;
  burger: string;
  steak: string;
  notes: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"stats" | "recipes" | "qr" | "settings">("stats");
  const [domainHost, setDomainHost] = useState("http://recipes-markzia.ddns.net");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recipes, setRecipes] = useState<Record<string, RecipeData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);
  const [viewingComment, setViewingComment] = useState<any | null>(null);

  // Site Settings State
  const [siteTitle, setSiteTitle] = useState("ملاحم ومطاعم المركزية");
  const [siteSubtitle, setSiteSubtitle] = useState("اختر صنف اللحوم أو الدجاج المفضل لديك واكتشف أسرار تتبيل وطهي أصنافنا الفاخرة.");
  const [meatTabLabel, setMeatTabLabel] = useState("قسم اللحوم الحمراء");
  const [chickenTabLabel, setChickenTabLabel] = useState("قسم الدجاج والطيور");
  const [allTabLabel, setAllTabLabel] = useState("جميع الأصناف");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Performance table search, filter, sort & pagination state
  const [perfSearch, setPerfSearch] = useState("");
  const [perfTypeFilter, setPerfTypeFilter] = useState<"all" | "meat" | "chicken">("all");
  const [perfSortBy, setPerfSortBy] = useState<"scans" | "rating" | "title">("scans");
  const [perfPage, setPerfPage] = useState(1);
  const itemsPerPage = 6;

  // Recipe editing state
  const [editingRecipe, setEditingRecipe] = useState<RecipeData | null>(null);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state fields
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrep, setFormPrep] = useState("");
  const [formCook, setFormCook] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formId, setFormId] = useState("");
  const [formCuisine, setFormCuisine] = useState("arabic");
  const [formMeatType, setFormMeatType] = useState<"meat" | "chicken">("meat");
  const [formCategory, setFormCategory] = useState("ستيك");
  const [formIcon, setFormIcon] = useState("");
  const [formIngredients, setFormIngredients] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formTips, setFormTips] = useState("");
  const [formMarinade, setFormMarinade] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStats(data);
        setError("");
      } else {
        setError(data.error || "فشل الاتصال بقاعدة البيانات، يرجى التأكد من DATABASE_URL في Netlify.");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم.");
    }
  };

  const fetchRecipes = async () => {
    try {
      const res = await fetch("/api/recipes");
      if (res.ok) {
        const data = await res.json();
        if (data.recipes) {
          setRecipes(data.recipes);
        }
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          if (data.settings.siteTitle) setSiteTitle(data.settings.siteTitle);
          if (data.settings.siteSubtitle) setSiteSubtitle(data.settings.siteSubtitle);
          if (data.settings.meatTabLabel) setMeatTabLabel(data.settings.meatTabLabel);
          if (data.settings.chickenTabLabel) setChickenTabLabel(data.settings.chickenTabLabel);
          if (data.settings.allTabLabel) setAllTabLabel(data.settings.allTabLabel);
        }
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            siteTitle,
            siteSubtitle,
            meatTabLabel,
            chickenTabLabel,
            allTabLabel,
          },
        }),
      });
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 4000);
      } else {
        alert("حدث خطأ أثناء حفظ الإعدادات");
      }
    } catch (err) {
      console.error(err);
      alert("فشل الاتصال بالخادم أثناء الحفظ");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setDomainHost(window.location.origin);
    }
    Promise.all([fetchStats(), fetchRecipes(), fetchSettings()]).then(() => setLoading(false));
  }, []);

  const handleSeed = async () => {
    setSeedLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        alert("تم تعبئة البيانات التجريبية بنجاح!");
        fetchStats();
      } else {
        alert("فشل تعبئة البيانات.");
      }
    } catch (err) {
      console.error(err);
      alert("خطأ بالاتصال.");
    } finally {
      setSeedLoading(false);
    }
  };

  const openRecipeEditor = (recipe: RecipeData) => {
    setEditingRecipe(recipe);
    setFormId(recipe.id);
    setFormTitle(recipe.title);
    setFormCategory(recipe.category || "ستيك");
    setFormMeatType(recipe.meatType || "meat");
    setFormDesc(recipe.description);
    setFormPrep(recipe.prepTime);
    setFormCook(recipe.cookTime);
    setFormVideoUrl(recipe.videoUrl || "");
    setFormCuisine(recipe.cuisine || "arabic");
    setFormIcon(recipe.icon || "");

    if (Array.isArray(recipe.ingredients)) {
      setFormIngredients(recipe.ingredients.join("\n"));
    } else if (typeof recipe.ingredients === "object" && recipe.ingredients !== null) {
      const list = (recipe.ingredients as any)["group-3"] || Object.values(recipe.ingredients)[0] || [];
      setFormIngredients(Array.isArray(list) ? list.join("\n") : "");
    } else {
      setFormIngredients("");
    }

    setFormInstructions(Array.isArray(recipe.instructions) ? recipe.instructions.join("\n") : "");
    setFormTips(Array.isArray(recipe.tips) ? recipe.tips.join("\n") : "");
    setFormMarinade(recipe.marinade || "");
    setSaveSuccess(false);
  };

  const handleAddNewRecipe = () => {
    const blankRecipe: RecipeData = {
      id: "",
      title: "",
      category: "جديد",
      meatType: "meat",
      description: "",
      prepTime: "15 دقيقة",
      cookTime: "10 دقائق",
      difficulty: "سهل",
      videoPlaceholder: "شاهد طريقة التحضير",
      videoUrl: "",
      ingredients: [],
      instructions: [],
      tips: [],
      marinade: "",
      cuisine: "arabic",
    };
    openRecipeEditor(blankRecipe);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe) return;

    setSavingRecipe(true);
    setSaveSuccess(false);

    try {
      const parsedIngredients = formIngredients
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const updatedData = {
        id: formId ? formId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "") : ("recipe_" + Date.now()),
        title: formTitle,
        category: formCategory || "عام",
        icon: formIcon,
        meatType: formMeatType || "meat",
        description: formDesc,
        prepTime: formPrep,
        cookTime: formCook,
        difficulty: editingRecipe.difficulty || "سهل",
        videoUrl: formVideoUrl,
        ingredients: parsedIngredients,
        instructions: formInstructions.split("\n").map((s) => s.trim()).filter(Boolean),
        tips: formTips.split("\n").map((s) => s.trim()).filter(Boolean),
        marinade: formMarinade,
        cuisine: formCuisine,
      };

      const res = await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        setSaveSuccess(true);
        await fetchRecipes(); // refresh recipes list
        setTimeout(() => {
          setEditingRecipe(null);
        }, 1200);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "حدث خطأ أثناء حفظ التعديلات.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("فشل الاتصال بالخادم.");
    } finally {
      setSavingRecipe(false);
    }
  };



  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <p style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  const totalScans = stats ? Object.values(stats.scans).reduce((a, b) => a + b, 0) : 0;
  const totalClicks = stats ? Object.values(stats.clicks).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="container animate-fade-in">
      {/* Admin Header */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px dashed var(--color-border)", paddingBottom: "1rem" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🔐</span> لوحة الإدارة والتحكم لملاحم المركزية
        </h2>
      </div>

      {/* Navigation Tabs */}
      <div className="scroll-tabs-container">
        <button
          className={`doneness-tab ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
          style={{ fontSize: "0.95rem", padding: "0.6rem 1.25rem" }}
        >
          📊 لوحة التحليلات والإحصائيات
        </button>
        <button
          className={`doneness-tab ${activeTab === "recipes" ? "active" : ""}`}
          onClick={() => setActiveTab("recipes")}
          style={{ fontSize: "0.95rem", padding: "0.6rem 1.25rem" }}
        >
          🎬 التعديل على الوصفات والفيديوهات
        </button>
        <button
          className={`doneness-tab ${activeTab === "qr" ? "active" : ""}`}
          onClick={() => setActiveTab("qr")}
          style={{ fontSize: "0.95rem", padding: "0.6rem 1.25rem" }}
        >
          🖨️ استخراج وطباعة رموز الـ QR
        </button>
        <button
          className={`doneness-tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
          style={{ fontSize: "0.95rem", padding: "0.6rem 1.25rem" }}
        >
          ⚙️ إعدادات أسماء الموقع والأقسام
        </button>
      </div>

      {error && <div className="card" style={{ color: "var(--color-danger)", textAlign: "center" }}>{error}</div>}

      {/* TAB 1: ANALYTICS DASHBOARD */}
      {activeTab === "stats" && stats && (
        <div>
          {/* Main Counters Grid (4 columns on desktop, 2 on mobile) */}
          <div className="grid-categories" style={{ marginBottom: "1.25rem" }}>
            <div className="card card-gold-border" style={{ padding: "1rem", textAlign: "center", marginBottom: 0 }}>
              <span style={{ fontSize: "1.5rem" }}>📱</span>
              <h4 style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.25rem 0" }}>إجمالي دخول العملاء</h4>
              <strong style={{ fontSize: "1.5rem", color: "white" }}>{totalScans}</strong>
            </div>

            <div className="card card-gold-border" style={{ padding: "1rem", textAlign: "center", marginBottom: 0 }}>
              <span style={{ fontSize: "1.5rem" }}>🎁</span>
              <h4 style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.25rem 0" }}>قاعدة العملاء (Leads)</h4>
              <strong style={{ fontSize: "1.5rem", color: "white" }}>{stats.leads.total}</strong>
            </div>

            <div className="card card-gold-border" style={{ padding: "1rem", textAlign: "center", marginBottom: 0 }}>
              <span style={{ fontSize: "1.5rem" }}>🛒</span>
              <h4 style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.25rem 0" }}>نقرات طلب المطعم</h4>
              <strong style={{ fontSize: "1.5rem", color: "white" }}>{totalClicks}</strong>
            </div>

            <div className="card card-gold-border" style={{ padding: "1rem", textAlign: "center", marginBottom: 0 }}>
              <span style={{ fontSize: "1.5rem" }}>📈</span>
              <h4 style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.25rem 0" }}>نسبة تحويل الطلبات</h4>
              <strong style={{ fontSize: "1.5rem", color: "var(--color-success)" }}>
                {totalScans > 0 ? `${((totalClicks / totalScans) * 100).toFixed(0)}%` : "0%"}
              </strong>
            </div>
          </div>

          {/* Production Real Data Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            {/* Export Leads Excel */}
            <a
              href="/api/export-leads"
              download
              className="btn-gold"
              style={{
                width: "auto",
                fontSize: "0.85rem",
                padding: "0.5rem 1.25rem",
                animation: "none",
                textDecoration: "none",
              }}
            >
              📥 تصدير قائمة العملاء إلى ملف Excel مرتب
            </a>

            {/* Clear/Reset Data for Real Launch */}
            <button
              onClick={() => {
                if (confirm("⚠️ هل أنت تأكد من رغبتك في تصفير وإعادة ضبط كافة بيانات المسح والتقييمات والعملاء للبدء الحقيقي؟")) {
                  handleSeed();
                }
              }}
              disabled={seedLoading}
              className="btn-outline"
              style={{
                fontSize: "0.85rem",
                padding: "0.5rem 1.25rem",
                borderColor: "rgba(239, 68, 68, 0.4)",
                color: "#f87171",
              }}
            >
              🔄 {seedLoading ? "جاري التصفير..." : "تصفير البيانات للبدء الحقيقي"}
            </button>
          </div>

          {/* Product & Platform Cards side-by-side on Desktop */}
          <div className="grid-two-column">
            {/* Product Performance Card */}
            <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-brand-gold)", margin: 0 }}>
                    📊 أداء المنتجات والوصفات
                  </h3>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.6rem", borderRadius: "10px" }}>
                    إجمالي المنتجات: {Object.keys(recipes).length + 2}
                  </span>
                </div>

                {/* Search Bar & Filter Controls */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  {/* Search Input */}
                  <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 ابحث عن اسم وصفة أو طبق..."
                    value={perfSearch}
                    onChange={(e) => {
                      setPerfSearch(e.target.value);
                      setPerfPage(1);
                    }}
                    style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", background: "#111" }}
                  />

                  {/* Filter Pills & Sort Selector */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    {/* Filter Pills */}
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button
                        onClick={() => { setPerfTypeFilter("all"); setPerfPage(1); }}
                        style={{
                          background: perfTypeFilter === "all" ? "var(--color-brand-gold)" : "rgba(255,255,255,0.05)",
                          color: perfTypeFilter === "all" ? "white" : "var(--color-text-muted)",
                          border: "none",
                          borderRadius: "12px",
                          padding: "0.25rem 0.65rem",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setPerfTypeFilter("meat"); setPerfPage(1); }}
                        style={{
                          background: perfTypeFilter === "meat" ? "var(--color-brand-gold)" : "rgba(255,255,255,0.05)",
                          color: perfTypeFilter === "meat" ? "white" : "var(--color-text-muted)",
                          border: "none",
                          borderRadius: "12px",
                          padding: "0.25rem 0.65rem",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        🥩 لحوم
                      </button>
                      <button
                        onClick={() => { setPerfTypeFilter("chicken"); setPerfPage(1); }}
                        style={{
                          background: perfTypeFilter === "chicken" ? "var(--color-brand-gold)" : "rgba(255,255,255,0.05)",
                          color: perfTypeFilter === "chicken" ? "white" : "var(--color-text-muted)",
                          border: "none",
                          borderRadius: "12px",
                          padding: "0.25rem 0.65rem",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        🍗 دجاج
                      </button>
                    </div>

                    {/* Sort Selector */}
                    <select
                      className="form-input"
                      value={perfSortBy}
                      onChange={(e) => { setPerfSortBy(e.target.value as any); setPerfPage(1); }}
                      style={{ padding: "0.2rem 0.5rem", fontSize: "0.72rem", background: "#111", color: "white", width: "auto" }}
                    >
                      <option value="scans">🔝 الأكثر زيارة ودخولاً</option>
                      <option value="rating">⭐ الأعلى تقييماً</option>
                      <option value="title">🔤 اسم الوصفة</option>
                    </select>
                  </div>
                </div>

                {/* Table Container */}
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>المنتج / الوصفة</th>
                        <th style={{ color: "var(--color-brand-gold)" }}>مرات دخول العملاء</th>
                        <th>التقييم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const allKeys = Array.from(
                          new Set([
                            "home",
                            "loyalty",
                            ...Object.keys(recipes),
                            ...Object.keys(stats.scans || {}),
                          ])
                        );

                        // 1. Build structured items
                        let items = allKeys.map((pKey) => {
                          let label = pKey;
                          let meatType: "meat" | "chicken" | "system" = "system";

                          if (pKey === "home") {
                            label = "🏠 الرمز العام (الصفحة الرئيسية)";
                          } else if (pKey === "loyalty") {
                            label = "🦁 رمز جمع نقاط الولاء (الملحمة)";
                          } else if (recipes[pKey]) {
                            meatType = recipes[pKey].meatType === "chicken" ? "chicken" : "meat";
                            label = (meatType === "chicken" ? "🍗 " : "🥩 ") + recipes[pKey].title;
                          }

                          const scanCount = stats.scans[pKey] || 0;
                          const ratingInfo = stats.ratings[pKey] || { count: 0, avg: 0 };

                          return {
                            id: pKey,
                            label,
                            meatType,
                            scanCount,
                            ratingAvg: ratingInfo.avg,
                            ratingCount: ratingInfo.count,
                          };
                        });

                        // 2. Filter by search query
                        if (perfSearch.trim()) {
                          const q = perfSearch.trim().toLowerCase();
                          items = items.filter((it) => it.label.toLowerCase().includes(q) || it.id.toLowerCase().includes(q));
                        }

                        // 3. Filter by Meat / Chicken type
                        if (perfTypeFilter !== "all") {
                          items = items.filter((it) => it.meatType === perfTypeFilter || it.meatType === "system");
                        }

                        // 4. Sort
                        if (perfSortBy === "scans") {
                          items.sort((a, b) => b.scanCount - a.scanCount);
                        } else if (perfSortBy === "rating") {
                          items.sort((a, b) => b.ratingAvg - a.ratingAvg);
                        } else if (perfSortBy === "title") {
                          items.sort((a, b) => a.label.localeCompare(b.label, "ar"));
                        }

                        // 5. Paginate
                        const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
                        const currentPage = Math.min(perfPage, totalPages);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

                        if (items.length === 0) {
                          return (
                            <tr>
                              <td colSpan={3} style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", padding: "1.5rem" }}>
                                لا توجد نتائج مطابقة للبحث أو الفلتر.
                              </td>
                            </tr>
                          );
                        }

                        return paginatedItems.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 700, color: "white", fontSize: "0.82rem", maxWidth: "220px", wordBreak: "break-word" }}>
                              {item.label}
                            </td>
                            <td style={{ fontWeight: 800, color: item.scanCount > 0 ? "var(--color-brand-gold)" : "white", fontSize: "0.85rem" }}>
                              {item.scanCount} زيارة
                            </td>
                            <td>
                              {item.ratingCount > 0 ? (
                                <span style={{ color: "var(--color-brand-gold)", fontWeight: 700, fontSize: "0.8rem" }}>
                                  {"★".repeat(Math.round(item.ratingAvg))} ({item.ratingAvg})
                                </span>
                              ) : (
                                <span style={{ color: "var(--color-text-muted)", fontSize: "0.72rem" }}>
                                  لا توجد تقييمات
                                </span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {(() => {
                const allKeysCount = Array.from(
                  new Set([
                    "home",
                    "loyalty",
                    ...Object.keys(recipes),
                    ...Object.keys(stats.scans || {}),
                  ])
                ).length;
                const totalPages = Math.ceil(allKeysCount / itemsPerPage) || 1;

                return (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--color-border)" }}>
                    <button
                      disabled={perfPage <= 1}
                      onClick={() => setPerfPage((p) => Math.max(1, p - 1))}
                      style={{
                        background: perfPage <= 1 ? "transparent" : "rgba(223, 138, 39, 0.15)",
                        color: perfPage <= 1 ? "var(--color-text-muted)" : "var(--color-brand-gold)",
                        border: "1px solid rgba(223, 138, 39, 0.3)",
                        borderRadius: "6px",
                        padding: "0.25rem 0.65rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: perfPage <= 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      السابق ➔
                    </button>

                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                      صفحة {perfPage} من {totalPages}
                    </span>

                    <button
                      disabled={perfPage >= totalPages}
                      onClick={() => setPerfPage((p) => Math.min(totalPages, p + 1))}
                      style={{
                        background: perfPage >= totalPages ? "transparent" : "rgba(223, 138, 39, 0.15)",
                        color: perfPage >= totalPages ? "var(--color-text-muted)" : "var(--color-brand-gold)",
                        border: "1px solid rgba(223, 138, 39, 0.3)",
                        borderRadius: "6px",
                        padding: "0.25rem 0.65rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: perfPage >= totalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      ← التالي
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Platform Performance Card */}
            <div className="card">
              <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-brand-gold)", marginBottom: "0.75rem" }}>
                🛵 مصادر طلبات التوصيل (نقرات)
              </h3>
              <div className="platforms-grid">
                <div>
                  <span style={{ fontSize: "1.2rem", display: "block" }}>🛵</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>طلبات</span>
                  <strong style={{ fontSize: "1.1rem", display: "block", color: "white" }}>{stats.clicks.talabat || 0}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "1.2rem", display: "block" }}>🚗</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>كريم</span>
                  <strong style={{ fontSize: "1.1rem", display: "block", color: "white" }}>{stats.clicks.careem || 0}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "1.2rem", display: "block" }}>🌐</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>الموقع</span>
                  <strong style={{ fontSize: "1.1rem", display: "block", color: "white" }}>{stats.clicks.website || 0}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "1.2rem", display: "block" }}>📞</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>الهاتف</span>
                  <strong style={{ fontSize: "1.1rem", display: "block", color: "white" }}>{stats.clicks.phone || 0}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Collected Leads Card */}
          <div className="card" style={{ marginTop: "1.25rem" }}>
            <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-brand-gold)", marginBottom: "0.5rem" }}>
              📞 قائمة العملاء المسجلين ({stats.leads.total})
            </h3>
            {stats.leads.recent.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textAlign: "center", padding: "1rem 0" }}>
                لا يوجد عملاء مسجلين بعد.
              </p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>اسم العميل</th>
                      <th>رقم الهاتف</th>
                      <th>الكوبون</th>
                      <th>تاريخ ووقت الإدخال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.leads.recent.map((lead) => (
                      <tr key={lead.id} style={{ fontSize: "0.85rem" }}>
                        <td style={{ color: "white", fontWeight: 700 }}>
                          👤 {lead.name || "عميل المركزية"}
                        </td>
                        <td style={{ color: "var(--color-brand-gold)", direction: "ltr", textAlign: "right", fontWeight: 600 }}>
                          {lead.contact}
                        </td>
                        <td>
                          <span className="badge badge-gold">{lead.promoCode}</span>
                        </td>
                        <td style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                          {new Date(lead.createdAt).toLocaleString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer Reviews & Feedback Comments Card */}
          <div className="card" style={{ marginTop: "1.25rem" }}>
            <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-brand-gold)", marginBottom: "0.5rem" }}>
              💬 أحدث تقييمات وملاحظات العملاء
            </h3>
            {!stats.recentRatings || stats.recentRatings.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textAlign: "center", padding: "1rem 0" }}>
                لا توجد تقييمات أو ملاحظات مسجلة بعد.
              </p>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>الوصفة / المنتج</th>
                      <th>التقييم</th>
                      <th>الملاحظات والتعليقات</th>
                      <th>تاريخ الإدخال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentRatings.map((rate: any) => {
                      const recipeLabels: Record<string, string> = {
                        steak: "🥩 ستيك ريب آي",
                        burger: "🍔 برغر بلدي",
                        kebab: "🔥 كباب بلدي",
                        ribs: "🍖 ريش غنم",
                        tenderloin: "🍽️ ستيك تندرلوين",
                        kofta: "🥘 كفتة بالصحن",
                        awsal: "🍢 أوصال لحم",
                        smash: "🧀 برغر سماش",
                      };
                      return (
                        <tr key={rate.id} style={{ fontSize: "0.85rem" }}>
                          <td style={{ color: "white", fontWeight: 700 }}>
                            {recipeLabels[rate.product] || rate.product}
                          </td>
                          <td style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                            {"★".repeat(rate.stars)}{"☆".repeat(5 - rate.stars)}
                          </td>
                          <td style={{ color: rate.comment ? "white" : "var(--color-text-muted)", fontStyle: rate.comment ? "normal" : "italic", maxWidth: "260px" }}>
                            {rate.comment ? (
                              rate.comment.length > 20 ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                  <span style={{ wordBreak: "break-word" }}>{rate.comment.substring(0, 18)}...</span>
                                  <button
                                    onClick={() => setViewingComment(rate)}
                                    style={{
                                      background: "rgba(223, 138, 39, 0.15)",
                                      color: "var(--color-brand-gold)",
                                      border: "1px solid rgba(223, 138, 39, 0.4)",
                                      borderRadius: "6px",
                                      padding: "0.2rem 0.55rem",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                      transition: "all 0.2s ease",
                                    }}
                                  >
                                    🔍 أظهر المزيد
                                  </button>
                                </div>
                              ) : (
                                rate.comment
                              )
                            ) : (
                              "بدون تعليق مضاف"
                            )}
                          </td>
                          <td style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                            {new Date(rate.createdAt).toLocaleString("ar-EG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Full Comment Modal Popup */}
          {viewingComment && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "1rem",
              }}
              className="animate-fade-in"
              onClick={() => setViewingComment(null)}
            >
              <div
                className="card card-gold-border"
                style={{
                  maxWidth: "500px",
                  width: "100%",
                  padding: "1.75rem",
                  position: "relative",
                  background: "#141414",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setViewingComment(null)}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    left: "1rem",
                    background: "rgba(255,255,255,0.08)",
                    border: "none",
                    color: "white",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>

                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "var(--color-brand-gold)",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>💬</span> تفاصيل تعليق وملاحظة العميل
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>المنتج / الوصفة:</span>
                    <span style={{ color: "white", fontWeight: 800, fontSize: "0.95rem" }}>
                      {viewingComment.product}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>التقييم:</span>
                    <span style={{ color: "var(--color-brand-gold)", fontWeight: 800, fontSize: "1.1rem" }}>
                      {"★".repeat(viewingComment.stars)}{"☆".repeat(5 - viewingComment.stars)} ({viewingComment.stars}/5)
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>تاريخ الإدخال:</span>
                    <span style={{ color: "var(--color-text-light)", fontSize: "0.8rem" }}>
                      {new Date(viewingComment.createdAt).toLocaleString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>

                  <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "0.85rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-brand-gold)", fontWeight: 800, display: "block", marginBottom: "0.4rem" }}>
                      📝 نص الملاحظة والتعليق كاملاً:
                    </span>
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "1rem",
                        color: "white",
                        lineHeight: 1.6,
                        fontSize: "0.95rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: "220px",
                        overflowY: "auto",
                      }}
                    >
                      {viewingComment.comment}
                    </div>
                  </div>
                </div>

                <button
                  className="btn-gold"
                  onClick={() => setViewingComment(null)}
                  style={{ width: "100%", padding: "0.65rem", fontSize: "0.9rem", fontWeight: 700 }}
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECIPE & VIDEO MANAGEMENT */}
      {activeTab === "recipes" && (
        <div className="animate-fade-in">
          <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", marginBottom: "0.5rem" }}>
            🎬 قائمة الوصفات وإدارة الفيديوهات
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            يمكنك من هنا إضافة أو تغيير رابط فيديو الشرح (YouTube أو رابط مباشر) والتعديل على المقادير والخطوات.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
            <button className="btn-gold" onClick={handleAddNewRecipe} style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              <span>➕</span> إضافة وصفة جديدة
            </button>
          </div>

          <div className="grid-categories">
            {Object.keys(recipes).map((p) => {
              const r = recipes[p];
              const title = r ? r.title : p;
              const hasVideo = r && r.videoUrl;
              const icon = p.includes("steak") ? "🥩" : p.includes("burger") ? "🍔" : p.includes("kebab") ? "🔥" : p.includes("ribs") ? "🍖" : "🍳";

              return (
                <div key={p} className="card card-gold-border" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "white" }}>
                        {icon} {title}
                      </h4>
                      <span className={`badge ${hasVideo ? "badge-gold" : ""}`} style={{ fontSize: "0.7rem" }}>
                        {hasVideo ? "🎥 يوجد فيديو" : "⚠️ بدون فيديو"}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1rem", lineHeight: 1.4 }}>
                      {r ? r.description : "انقر لتعديل تفاصيل هذه الوصفة."}
                    </p>

                    {hasVideo && (
                      <p style={{ fontSize: "0.75rem", color: "var(--color-brand-gold)", marginBottom: "1rem", wordBreak: "break-all", direction: "ltr", textAlign: "right" }}>
                        🔗 {r.videoUrl}
                      </p>
                    )}
                  </div>

                  <button
                    className="btn-gold"
                    onClick={() => openRecipeEditor(r)}
                    style={{ fontSize: "0.85rem", padding: "0.6rem" }}
                  >
                    ✏️ تعديل الوصفة والفيديو
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: QR CODE EXTRACTION & PRINTING */}
      {activeTab === "qr" && (
        <div className="animate-fade-in">
          <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", marginBottom: "0.5rem" }}>
            🖨️ استخراج وطباعة رموز الـ QR للعبوات
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            استخرج وحمّل رموز الـ QR عالية الدقة لكل عبوة لحم في ملاحم ومطاعم المركزية لطباعتها ولصقها على المنتجات مباشرة.
          </p>

          {/* Domain Host Input */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
              🌐 عنوان موقع الويب (النطاق / Domain Host):
            </label>
            <input
              type="text"
              className="form-input"
              value={domainHost}
              onChange={(e) => setDomainHost(e.target.value)}
              placeholder="مثال: https://recipes.markzia.com أو http://localhost:3000"
              style={{ direction: "ltr", textAlign: "left", marginTop: "0.35rem" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.35rem", display: "block" }}>
              * عند رفع الموقع على الدومين الحقيقي الخاص بكم (مثل recipes.markzia.com)، قم بتأكيد العنوان أعلاه وسيتم توليد جميع الرموز لهذا الدومين تلقائياً.
            </span>
          </div>

          {/* Products QR Grid */}
          <div className="grid-categories" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {[
              { id: "home", title: "الرمز العام (الصفحة الرئيسية)", icon: "🏠", path: "/?source=qr" },
              { id: "loyalty", title: "رمز جمع نقاط الولاء (يُعلق في الملحمة)", icon: "🦁", path: "/collect?source=qr" },
            ].map((prod) => {
              const fullUrl = `${domainHost.replace(/\/$/, "")}${prod.path}`;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(fullUrl)}`;

              return (
                <div key={prod.id} className="card card-gold-border" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "2.5rem", display: "block" }}>{prod.icon}</span>
                  <h4 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", margin: "0.5rem 0" }}>
                    {prod.title}
                  </h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem", direction: "ltr" }}>
                    {fullUrl}
                  </p>

                  {/* QR Image Preview */}
                  <div
                    style={{
                      background: "white",
                      padding: "0.75rem",
                      borderRadius: "12px",
                      display: "inline-block",
                      marginBottom: "1rem",
                      boxShadow: "0 0 15px rgba(223, 138, 39, 0.2)",
                    }}
                  >
                    <img src={qrImageUrl} alt={prod.title} style={{ width: "180px", height: "180px", display: "block" }} />
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                    <div
                      style={{
                        background: "rgba(223, 138, 39, 0.1)",
                        border: "1px solid var(--color-brand-gold)",
                        color: "white",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        textAlign: "center"
                      }}
                    >
                      👁️ عدد الزيارات (مسح الـ QR): <strong style={{ color: "var(--color-brand-gold)", fontSize: "1rem" }}>{stats ? (stats.scans[prod.id] || 0) : 0}</strong>
                    </div>

                    <button
                      onClick={() => {
                        const printWin = window.open("", "_blank");
                        if (printWin) {
                          printWin.document.write(`
                            <html dir="rtl">
                            <head>
                              <title>ملصق QR - ${prod.title}</title>
                              <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #fff; }
                                .sticker { border: 3px double #df8a27; border-radius: 20px; padding: 25px; max-width: min(350px, 100%); margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                                .logo { width: 90px; height: 90px; border-radius: 50%; }
                                h2 { color: #000; margin: 10px 0 5px 0; font-size: 20px; }
                                p { color: #555; font-size: 13px; margin-bottom: 15px; }
                                img.qr { max-width: 100%; width: min(220px, 100%); height: auto; }
                                .footer-text { background: #141414; color: #df8a27; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 13px; margin-top: 15px; }
                              </style>
                            </head>
                            <body onload="window.print();">
                              <div class="sticker">
                                <img src="/logo.jpg" class="logo" />
                                <h2>مطاعم وملاحم المركزية</h2>
                                <p>${prod.title}</p>
                                <img src="${qrImageUrl}" class="qr" />
                                <div class="footer-text">امسح الرمز للحصول على وصفات احترافية ومكافآت مجانية 🎁</div>
                              </div>
                            </body>
                            </html>
                          `);
                          printWin.document.close();
                        }
                      }}
                      className="btn-outline"
                      style={{ fontSize: "0.8rem", padding: "0.5rem" }}
                    >
                      🖨️ طباعة ملصق العبوة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* EDIT RECIPE MODAL */}
      {editingRecipe && (
        <div className="modal-overlay" onClick={() => setEditingRecipe(null)}>
          <div
            className="modal-content animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "650px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <button className="modal-close" onClick={() => setEditingRecipe(null)}>
              &times;
            </button>

            <h3 style={{ fontWeight: 800, color: "var(--color-brand-gold)", fontSize: "1.2rem", marginBottom: "0.35rem" }}>
              ✏️ تعديل وصفة ({editingRecipe.title})
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              أدخل رابط فيديو YouTube أو فيديو مباشر، وعدّل تفاصيل الوصفة ثم اضغط حفظ.
            </p>

            {saveSuccess && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid var(--color-success)",
                  color: "var(--color-success)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: "1rem",
                }}
              >
                ✓ تم حفظ التعديلات والفيديو بنجاح!
              </div>
            )}

            <form onSubmit={handleSaveRecipe}>
              {/* Primary Type: Meat vs Chicken & Subcategory */}
              <div className="responsive-two-column-grid">
                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                    🥩 🍗 الصنف الأساسي (نوع اللحم / الدجاج):
                  </label>
                  <select
                    className="form-input"
                    value={formMeatType}
                    onChange={(e) => setFormMeatType(e.target.value as "meat" | "chicken")}
                    style={{ background: "#111", color: "white", padding: "0.5rem", fontWeight: 700 }}
                  >
                    <option value="meat">🥩 قسم اللحوم الحمراء (ستيك، كباب، ريش، برغر...)</option>
                    <option value="chicken">🍗 قسم الدجاج والطيور (شيش طاووق، برغر دجاج...)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">اسم التصنيف الفرعي (مثل: ستيك، برغر، كباب، شيش طاووق):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="مثال: شيش طاووق، ستيك، برغر..."
                    required
                  />
                </div>
              </div>

              {/* Custom Emoji / Icon Input */}
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                  🎨 إيموجي / أيقونة الوصفة (اختر أو اكتب أي إيموجي):
                </label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: 🥩 أو 🍗 أو 🍔 أو 🍢"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    style={{ width: "120px", fontSize: "1.2rem", textAlign: "center" }}
                  />
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {["🥩", "🍗", "🍔", "🔥", "🍖", "🥘", "🍢", "🌭", "🌮", "👑", "✨"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormIcon(emoji)}
                        style={{
                          padding: "0.35rem 0.6rem",
                          borderRadius: "6px",
                          border: formIcon === emoji ? "2px solid var(--color-brand-gold)" : "1px solid var(--color-border)",
                          background: formIcon === emoji ? "rgba(234, 179, 8, 0.2)" : "#27272a",
                          cursor: "pointer",
                          fontSize: "1.1rem",
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Video URL Input */}
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                  🎥 رابط فيديو الشرح (رابط YouTube أو رابط MP4 مباشر):
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  * يمكنك وضع رابط فيديو عادي أو Shorts من يوتيوب، وسيتم عرضه تلقائياً داخل المشغل.
                </span>
              </div>

              {/* Title & Description */}
              <div className="form-group">
                <label className="form-label">عنوان الوصفة:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">وصف الوصفة:</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Prep & Cook Times */}
              <div className="responsive-two-column-grid">
                <div className="form-group">
                  <label className="form-label">وقت التحضير:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPrep}
                    onChange={(e) => setFormPrep(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">وقت الطهي:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formCook}
                    onChange={(e) => setFormCook(e.target.value)}
                  />
                </div>
              </div>

              {/* Marinade */}
              <div className="form-group">
                <label className="form-label">طريقة التتبيل:</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={formMarinade}
                  onChange={(e) => setFormMarinade(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Ingredients (المكونات والمقادير) */}
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                  📋 المكونات والمقادير الكاملة (مكون واحد في كل سطر):
                </label>
                <textarea
                  className="form-input"
                  rows={6}
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  style={{ resize: "vertical", borderColor: "rgba(223, 138, 39, 0.4)" }}
                  placeholder="اكتب المكونات هنا... مثلاً:&#10;1 قطعة ستيك ريب آي من المركزية 3-4 سم&#10;ملح بحري خشن وفلفل أسود طازج&#10;3 ملاعق كبار زبدة غير مملحة عالية الجودة&#10;3 فصوص ثوم مهروسة بلطف"
                />
              </div>

              {/* Instructions */}
              <div className="form-group">
                <label className="form-label">خطوات التحضير والطهي (خطوة واحدة في كل سطر):</label>
                <textarea
                  className="form-input"
                  rows={5}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Tips */}
              <div className="form-group">
                <label className="form-label">نصائح الطاهي الذهبية (نصيحة واحدة في كل سطر):</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formTips}
                  onChange={(e) => setFormTips(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button type="submit" className="btn-gold" disabled={savingRecipe} style={{ marginTop: "0.5rem" }}>
                {savingRecipe ? "جاري حفظ التغييرات..." : "💾 حفظ التغييرات والفيديو"}
              </button>
            </form>
          </div>
        </div>
      )}



      {/* TAB 4: SITE SETTINGS */}
      {activeTab === "settings" && (
        <div className="card animate-fade-in" style={{ maxWidth: "650px", margin: "1.5rem auto 0 auto" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-brand-gold)", marginBottom: "1.25rem", textAlign: "center" }}>
            ⚙️ التحكم في أسماء الموقع وأقسام المنتجات
          </h3>

          {settingsSuccess && (
            <div style={{ padding: "0.75rem", backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#4ade80", borderRadius: "8px", marginBottom: "1.25rem", textAlign: "center", fontWeight: 700 }}>
              ✅ تم حفظ الإعدادات بنجاح وتحديث الموقع الرئيسي!
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.4rem", color: "white" }}>
                🏷️ اسم الموقع الرئيسي (العنوان العلوي):
              </label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="مثال: ملاحم ومطاعم المركزية"
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "#18181b", color: "white" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.4rem", color: "white" }}>
                📝 الوصف الفرعي للموقع:
              </label>
              <textarea
                rows={2}
                value={siteSubtitle}
                onChange={(e) => setSiteSubtitle(e.target.value)}
                placeholder="اختر صنف اللحوم أو الدجاج المفضل لديك..."
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "#18181b", color: "white", resize: "vertical" }}
              />
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-brand-gold)", marginBottom: "0.85rem" }}>
                🥩 أسماء الأقسام الرئيسية (أزرار التصفية في الموقع):
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "white" }}>
                    🥩 اسم قسم اللحوم:
                  </label>
                  <input
                    type="text"
                    value={meatTabLabel}
                    onChange={(e) => setMeatTabLabel(e.target.value)}
                    placeholder="مثال: قسم اللحوم الحمراء"
                    style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "#18181b", color: "white" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "white" }}>
                    🍗 اسم قسم الدجاج:
                  </label>
                  <input
                    type="text"
                    value={chickenTabLabel}
                    onChange={(e) => setChickenTabLabel(e.target.value)}
                    placeholder="مثال: قسم الدجاج"
                    style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "#18181b", color: "white" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "white" }}>
                    🌟 اسم زر (جميع الأصناف):
                  </label>
                  <input
                    type="text"
                    value={allTabLabel}
                    onChange={(e) => setAllTabLabel(e.target.value)}
                    placeholder="مثال: جميع الأصناف"
                    style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "#18181b", color: "white" }}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn-gold"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", fontWeight: 800, marginTop: "0.5rem" }}
            >
              {savingSettings ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
