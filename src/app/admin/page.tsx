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
  source?: string;
  createdAt: string;
}

interface StatsData {
  scans: Record<string, number>;
  qrScansCount?: number;
  directVisitsCount?: number;
  totalScansCount?: number;
  ratings: Record<string, { count: number; avg: number }>;
  leads: {
    total: number;
    recent: Lead[];
  };
  clicks: Record<string, number>;
  recentScans: Scan[];
  recentRatings?: any[];
  dbConnected: boolean;
  dbError: string | null;
}

interface Product {
  id: string;
  name: string;
  weight: string;
  icon: string;
  imageUrl?: string;
  sortOrder: number;
}

interface RecipeData {
  id: string;
  title: string;
  category: string;
  meatType?: "meat" | "chicken";
  productId?: string;
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  videoPlaceholder: string;
  videoUrl?: string;
  icon?: string;
  imageUrl?: string;
  ingredients: any;
  instructions: string[];
  tips: string[];
  marinade: string;
  cuisine?: string;
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"stats" | "recipes" | "qr" | "settings" | "loyalty">("stats");
  const [domainHost, setDomainHost] = useState("");
  const [loyaltyCards, setLoyaltyCards] = useState<any[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [productsList, setProductsList] = useState<Product[]>(STATIC_PRODUCTS);
  const [recipes, setRecipes] = useState<Record<string, RecipeData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);
  const [viewingComment, setViewingComment] = useState<any | null>(null);

  // Site Settings State
  const [siteTitle, setSiteTitle] = useState("ملاحم ومطاعم المركزية");
  const [siteSubtitle, setSiteSubtitle] = useState("اختر صنف اللحوم أو الدجاج المفضل لديك واكتشف أسرار تتبيل وطهي أصنافنا الفاخرة.");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Performance table search, sort & pagination state
  const [perfSearch, setPerfSearch] = useState("");
  const [perfSortBy, setPerfSortBy] = useState<"scans" | "rating" | "title">("scans");
  const [perfPage, setPerfPage] = useState(1);
  const itemsPerPage = 8;

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
  const [formProductId, setFormProductId] = useState("");
  const [formCategory, setFormCategory] = useState("عام");
  const [formIcon, setFormIcon] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
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
        setError(data.error || "فشل الاتصال بقاعدة البيانات.");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم.");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
        }
      }
    } catch (err) {
      console.error("Error fetching products:", err);
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
        }
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const fetchLoyaltyCards = async () => {
    setLoyaltyLoading(true);
    try {
      const res = await fetch("/api/loyalty/all", { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setLoyaltyCards(data.cards || []);
    } catch (err) {
      console.error("Failed to fetch loyalty cards:", err);
    } finally {
      setLoyaltyLoading(false);
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
    Promise.all([fetchStats(), fetchProducts(), fetchRecipes(), fetchSettings()]).then(() => setLoading(false));
    fetchLoyaltyCards();
  }, []);

  const handleSeed = async () => {
    setSeedLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        alert("تم إعادة ضبط البيانات بنجاح!");
        fetchStats();
        fetchProducts();
        fetchRecipes();
      } else {
        alert("فشل إعادة ضبط البيانات.");
      }
    } catch (err) {
      console.error(err);
      alert("خطأ بالاتصال.");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("⚠️ هل أنت تأكد من رغبتك في حذف هذه الوصفة؟")) return;
    try {
      const res = await fetch(`/api/recipes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        await fetchRecipes();
      } else {
        alert("فشل حذف الوصفة.");
      }
    } catch (err) {
      console.error(err);
      alert("خطأ بالاتصال.");
    }
  };

  const openRecipeEditor = (recipe: RecipeData) => {
    setEditingRecipe(recipe);
    setFormId(recipe.id);
    setFormTitle(recipe.title);
    setFormCategory(recipe.category || "عام");
    setFormProductId(recipe.productId || "");
    setFormDesc(recipe.description);
    setFormPrep(recipe.prepTime);
    setFormCook(recipe.cookTime);
    setFormVideoUrl(recipe.videoUrl || "");
    setFormCuisine(recipe.cuisine || "arabic");
    setFormIcon(recipe.icon || "");
    setFormImageUrl(recipe.imageUrl || "");

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
      category: "عام",
      productId: productsList[0]?.id || "katef-kharouf",
      description: "",
      prepTime: "15 دقيقة",
      cookTime: "10 دقائق",
      difficulty: "سهل",
      videoPlaceholder: "شاهد طريقة التحضير",
      videoUrl: "",
      icon: "🥩",
      imageUrl: "",
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
        productId: formProductId || "",
        icon: formIcon,
        imageUrl: formImageUrl,
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
        await fetchRecipes();
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
          🎬 إدارة الوصفات والفيديوهات
        </button>
        <button
          className={`doneness-tab ${activeTab === "qr" ? "active" : ""}`}
          onClick={() => setActiveTab("qr")}
          style={{ fontSize: "0.95rem", padding: "0.6rem 1.25rem" }}
        >
          🖨️ استخراج وطباعة رموز الـ QR للعبوات
        </button>
        <button
          className={`doneness-tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
          style={{ fontSize: "0.95rem", padding: "0.6rem 1.25rem" }}
        >
          ⚙️ إعدادات الموقع
        </button>
        <button
          className={`doneness-tab ${activeTab === "loyalty" ? "active" : ""}`}
          onClick={() => { setActiveTab("loyalty"); fetchLoyaltyCards(); }}
          style={{ fontSize: "0.95rem", padding: "0.6rem 1.25rem" }}
        >
          🦁 بطاقات الولاء
        </button>
      </div>

      {error && <div className="card" style={{ color: "var(--color-danger)", textAlign: "center", fontWeight: 700, marginBottom: "1rem" }}>{error}</div>}

      {/* DB Connection Status Banner */}
      {stats && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.85rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            background: stats.dbConnected ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.12)",
            border: stats.dbConnected ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(239,68,68,0.4)",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          <span style={{ fontSize: "1rem" }}>{stats.dbConnected ? "🟢" : "🔴"}</span>
          <span style={{ color: stats.dbConnected ? "var(--color-success)" : "#f87171", wordBreak: "break-word" }}>
            {stats.dbConnected
              ? "قاعدة البيانات متصلة — البيانات حقيقية من الداتابيز"
              : `قاعدة البيانات غير متصلة: ${stats.dbError || "تحقق من DATABASE_URL"}`}
          </span>
          <button
            onClick={fetchStats}
            style={{ marginRight: "auto", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--color-text-muted)", borderRadius: "6px", padding: "0.2rem 0.55rem", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit" }}
          >
            🔄 تحديث
          </button>
        </div>
      )}

      {/* TAB 1: ANALYTICS DASHBOARD */}
      {activeTab === "stats" && stats && (
        <div>
          {/* Main Counters Grid */}
          <div className="grid-categories" style={{ marginBottom: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {/* Dedicated QR Scans Card */}
            <div className="card card-gold-border" style={{ padding: "1rem", textAlign: "center", marginBottom: 0, background: "linear-gradient(135deg, rgba(223,138,39,0.15) 0%, rgba(20,16,12,0.9) 100%)" }}>
              <span style={{ fontSize: "1.6rem" }}>📲</span>
              <h4 style={{ fontSize: "0.8rem", color: "var(--color-brand-gold)", fontWeight: 800, margin: "0.25rem 0" }}>مسحات رمز الـ QR</h4>
              <strong style={{ fontSize: "1.6rem", color: "var(--color-brand-gold)" }}>{stats.qrScansCount || 0}</strong>
              <span style={{ display: "block", fontSize: "0.68rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>من الرمز المطبوع فقط</span>
            </div>

            {/* Total Page Visits */}
            <div className="card card-gold-border" style={{ padding: "1rem", textAlign: "center", marginBottom: 0 }}>
              <span style={{ fontSize: "1.5rem" }}>🌐</span>
              <h4 style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.25rem 0" }}>إجمالي زيارات الموقع</h4>
              <strong style={{ fontSize: "1.5rem", color: "white" }}>{stats.totalScansCount || totalScans}</strong>
              <span style={{ display: "block", fontSize: "0.68rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>شامل التصفح المباشر</span>
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

          {/* Production Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
            }}
          >
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
              📥 تصدير قائمة العملاء إلى ملف Excel
            </a>

            <button
              onClick={() => {
                if (confirm("⚠️ هل أنت تأكد من رغبتك في إعادة ضبط بيانات المسح والتجربة؟")) {
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
              🔄 {seedLoading ? "جاري الإعادة..." : "تصفير البيانات وإعادة الضبط"}
            </button>
          </div>

          {/* Performance Table */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-brand-gold)", margin: 0 }}>
                📊 أداء زيارات أصناف اللحوم والصفحات
              </h3>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.6rem", borderRadius: "10px" }}>
                إجمالي الأصناف: {productsList.length}
              </span>
            </div>

            {/* Search Bar & Sort Selector */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 ابحث عن صنف لحم..."
                value={perfSearch}
                onChange={(e) => {
                  setPerfSearch(e.target.value);
                  setPerfPage(1);
                }}
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", background: "#111", flex: 1, minWidth: "200px" }}
              />

              <select
                className="form-input"
                value={perfSortBy}
                onChange={(e) => { setPerfSortBy(e.target.value as any); setPerfPage(1); }}
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem", background: "#111", color: "white", width: "auto" }}
              >
                <option value="scans">🔝 الأكثر زيارة ودخولاً</option>
                <option value="rating">⭐ الأعلى تقييماً</option>
                <option value="title">🔤 اسم الصنف</option>
              </select>
            </div>

            {/* Table Container */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>صنف اللحم / الصفحة</th>
                    <th style={{ color: "var(--color-brand-gold)" }}>مرات الزيارة والمسح</th>
                    <th>التقييم العام</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const productMap = new Map<string, { label: string; icon: string }>();
                    productMap.set("home", { label: "🏠 الرمز العام (الصفحة الرئيسية)", icon: "🏠" });
                    productMap.set("loyalty", { label: "🦁 رمز جمع نقاط الولاء (الملحمة)", icon: "🦁" });

                    productsList.forEach((p) => {
                      productMap.set(p.id, { label: `${p.icon} ${p.name}`, icon: p.icon });
                    });

                    // Add any other keys from stats.scans
                    Object.keys(stats.scans || {}).forEach((k) => {
                      if (!productMap.has(k)) {
                        productMap.set(k, { label: `🥩 ${recipes[k]?.title || k}`, icon: "🥩" });
                      }
                    });

                    let items = Array.from(productMap.entries()).map(([pKey, info]) => {
                      const scanCount = stats.scans[pKey] || 0;
                      const ratingInfo = stats.ratings[pKey] || { count: 0, avg: 0 };
                      return {
                        id: pKey,
                        label: info.label,
                        scanCount,
                        ratingAvg: ratingInfo.avg,
                        ratingCount: ratingInfo.count,
                      };
                    });

                    // Filter search
                    if (perfSearch.trim()) {
                      const q = perfSearch.trim().toLowerCase();
                      items = items.filter((it) => it.label.toLowerCase().includes(q) || it.id.toLowerCase().includes(q));
                    }

                    // Sort
                    if (perfSortBy === "scans") {
                      items.sort((a, b) => b.scanCount - a.scanCount);
                    } else if (perfSortBy === "rating") {
                      items.sort((a, b) => b.ratingAvg - a.ratingAvg);
                    } else if (perfSortBy === "title") {
                      items.sort((a, b) => a.label.localeCompare(b.label, "ar"));
                    }

                    // Paginate
                    const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
                    const currentPage = Math.min(perfPage, totalPages);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

                    if (items.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", padding: "1.5rem" }}>
                            لا توجد نتائج مطابقة للبحث.
                          </td>
                        </tr>
                      );
                    }

                    return paginatedItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700, color: "white", fontSize: "0.85rem" }}>
                          {item.label}
                        </td>
                        <td style={{ fontWeight: 800, color: item.scanCount > 0 ? "var(--color-brand-gold)" : "white", fontSize: "0.85rem" }}>
                          {item.scanCount} زيارة
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>
                          {item.ratingCount > 0 ? (
                            <span style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                              ★ {item.ratingAvg} ({item.ratingCount})
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)" }}>لا تقييمات</span>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Leads Table */}
          <div className="card" style={{ marginTop: "1.25rem" }}>
            <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-brand-gold)", marginBottom: "0.5rem" }}>
              🎁 قاعدة العملاء الراغبين بالخصم (Leads)
            </h3>
            {!stats.leads.recent || stats.leads.recent.length === 0 ? (
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
        </div>
      )}

      {/* TAB 2: RECIPE & VIDEO MANAGEMENT */}
      {activeTab === "recipes" && (
        <div className="animate-fade-in">
          <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", marginBottom: "0.5rem" }}>
            🎬 قائمة الوصفات وإدارة الفيديوهات
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            يمكنك إضافة وإدارة وصفات التحضير والفيديوهات لكل صنف من أصناف اللحوم الـ 18.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
            <button className="btn-gold" onClick={handleAddNewRecipe} style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              <span>➕</span> إضافة وصفة جديدة
            </button>
          </div>

          <div className="grid-categories">
            {Object.keys(recipes).length === 0 ? (
              <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                <p style={{ color: "var(--color-text-muted)" }}>لا توجد وصفات مضافة بعد. يمكنك الضغط على "إضافة وصفة جديدة" بالأعلى لإضافة أول وصفة.</p>
              </div>
            ) : (
              Object.keys(recipes).map((p) => {
                const r = recipes[p];
                const title = r ? r.title : p;
                const hasVideo = r && r.videoUrl;
                const icon = r.icon || "🥩";

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
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button
                        className="btn-gold"
                        onClick={() => openRecipeEditor(r)}
                        style={{ fontSize: "0.85rem", padding: "0.5rem 0.85rem", flex: 1 }}
                      >
                        ✏️ تعديل
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => handleDeleteRecipe(r.id)}
                        style={{ fontSize: "0.85rem", padding: "0.5rem 0.85rem", borderColor: "rgba(239, 68, 68, 0.4)", color: "#f87171" }}
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QR CODE EXTRACTION & PRINTING FOR ALL 18 PRODUCTS */}
      {activeTab === "qr" && (
        <div className="animate-fade-in">
          <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", marginBottom: "0.5rem" }}>
            🖨️ استخراج وطباعة رموز الـ QR لجميع أصناف اللحوم الـ 18
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            استخرج وحمّل رموز الـ QR عالية الدقة لكل عبوة وصنف من أصناف المركزية لطباعتها ولصقها على أطباق العبوات مباشرة.
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
              placeholder="مثال: https://almarkazia.alidanoun440.workers.dev"
              style={{ direction: "ltr", textAlign: "left", marginTop: "0.35rem" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.35rem", display: "block" }}>
              * التأكد من النطاق يضمن توجيه مسح الـ QR للرابط الصحيح.
            </span>
          </div>

          {/* All 18 Products + System QR Grid */}
          <div className="grid-categories" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {[
              { id: "home", title: "الرمز العام (الصفحة الرئيسية)", icon: "🏠", path: "/?source=qr" },
              { id: "loyalty", title: "رمز جمع نقاط الولاء (الملحمة)", icon: "🦁", path: "/collect?source=qr" },
              ...productsList.map((p) => ({
                id: p.id,
                title: p.name,
                icon: p.icon,
                path: `/${p.id}?source=qr`,
              })),
            ].map((prod) => {
              const fullUrl = `${domainHost.replace(/\/$/, "")}${prod.path}`;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(fullUrl)}`;

              return (
                <div key={prod.id} className="card card-gold-border" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "2.5rem", display: "block" }}>{prod.icon}</span>
                  <h4 style={{ fontWeight: 800, fontSize: "1rem", color: "white", margin: "0.5rem 0", height: "2.4rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {prod.title}
                  </h4>

                  {/* QR Image Preview */}
                  <div
                    style={{
                      background: "white",
                      padding: "0.6rem",
                      borderRadius: "12px",
                      display: "inline-block",
                      marginBottom: "0.85rem",
                      boxShadow: "0 0 15px rgba(223, 138, 39, 0.2)",
                    }}
                  >
                    <img src={qrImageUrl} alt={prod.title} style={{ width: "160px", height: "160px", display: "block" }} />
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                    <div
                      style={{
                        background: "rgba(223, 138, 39, 0.1)",
                        border: "1px solid var(--color-brand-gold)",
                        color: "white",
                        borderRadius: "8px",
                        padding: "0.4rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textAlign: "center"
                      }}
                    >
                      👁️ عدد الزيارات (QR): <strong style={{ color: "var(--color-brand-gold)", fontSize: "0.95rem" }}>{stats ? (stats.scans[prod.id] || 0) : 0}</strong>
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
                                p { color: #555; font-size: 14px; margin-bottom: 15px; font-weight: bold; }
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
                      style={{ fontSize: "0.8rem", padding: "0.45rem" }}
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

      {/* TAB 4: SITE SETTINGS */}
      {activeTab === "settings" && (
        <div className="card animate-fade-in" style={{ maxWidth: "650px", margin: "1.5rem auto 0 auto" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-brand-gold)", marginBottom: "1.25rem", textAlign: "center" }}>
            ⚙️ التحكم في إعدادات وعنوان الموقع
          </h3>

          {settingsSuccess && (
            <div style={{ padding: "0.75rem", backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#4ade80", borderRadius: "8px", marginBottom: "1.25rem", textAlign: "center", fontWeight: 700 }}>
              ✅ تم حفظ الإعدادات بنجاح!
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
                placeholder="اختر صنف اللحوم المفضلة لديك واكتشف أسرار التتبيل..."
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-border)", background: "#18181b", color: "white", resize: "vertical" }}
              />
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

      {/* TAB 5: LOYALTY CARDS DASHBOARD */}
      {activeTab === "loyalty" && (
        <div className="animate-fade-in">
          {/* Header */}
          <div className="card card-gold-border" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.2rem" }}>🦁 بطاقات الولاء الرقمية</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                كل عميل سجّل رقمه وجمع نقاطاً يظهر هنا. مرتبون من الأعلى نقاطاً.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="card-gold-border" style={{ borderRadius: "8px", padding: "0.5rem 0.85rem", fontSize: "0.8rem", fontWeight: 700, textAlign: "center" }}>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.7rem" }}>إجمالي البطاقات</div>
                <div style={{ color: "white", fontSize: "1.1rem" }}>{loyaltyCards.length}</div>
              </div>
              <div className="card-gold-border" style={{ borderRadius: "8px", padding: "0.5rem 0.85rem", fontSize: "0.8rem", fontWeight: 700, textAlign: "center" }}>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.7rem" }}>مستحقون للخصم</div>
                <div style={{ color: "var(--color-success)", fontSize: "1.1rem" }}>
                  {loyaltyCards.filter(c => c.points >= 10 && !c.rewardUsed).length}
                </div>
              </div>
              <button
                onClick={fetchLoyaltyCards}
                className="btn-gold"
                style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", width: "auto", animation: "none" }}
              >
                {loyaltyLoading ? "⏳ تحديث..." : "🔄 تحديث"}
              </button>
            </div>
          </div>

          {/* Cards Table */}
          {loyaltyLoading && loyaltyCards.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              ⏳ جاري تحميل بطاقات الولاء...
            </div>
          ) : loyaltyCards.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🦁</div>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                لا يوجد عملاء مسجلون في برنامج الولاء بعد. عندما يمسح العملاء رمز QR الولاء ويدخلون أرقامهم، ستظهر بطاقاتهم هنا.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {loyaltyCards.map((card, idx) => {
                const isMaxed = card.points >= 10 && !card.rewardUsed;
                return (
                  <div
                    key={card.id || idx}
                    className="card"
                    style={{
                      border: isMaxed
                        ? "1px solid var(--color-success)"
                        : "1px solid rgba(255,255,255,0.05)",
                      padding: "1rem 1.25rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {/* Customer Info */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "white" }}>
                            {card.name || "عميل مجهول"}
                          </span>
                          {isMaxed && (
                            <span style={{ background: "var(--color-success)", color: "white", fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                              🏆 مستحق للخصم
                            </span>
                          )}
                          {card.rewardUsed && (
                            <span style={{ background: "rgba(255,255,255,0.1)", color: "var(--color-text-muted)", fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                              ✅ استخدم الخصم
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.2rem", direction: "ltr" }}>
                          📱 {card.phone}
                        </div>
                        {card.rewardCode && (
                          <div style={{ fontSize: "0.75rem", color: isMaxed ? "var(--color-success)" : "var(--color-text-muted)", marginTop: "0.2rem", fontFamily: "monospace", fontWeight: 700 }}>
                            🎟️ {card.rewardCode}
                          </div>
                        )}
                      </div>
                      {/* Points Badge */}
                      <div style={{ textAlign: "center", minWidth: "60px" }}>
                        <div style={{ fontSize: "1.6rem", fontWeight: 900, color: isMaxed ? "var(--color-success)" : "var(--color-brand-gold)", lineHeight: 1 }}>
                          {card.points}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>/ 10 نقاط</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                          إجمالي: {card.totalEarned}
                        </div>
                      </div>
                    </div>

                    {/* Progress dots */}
                    <div>
                      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.4rem" }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: "8px",
                              borderRadius: "4px",
                              background: i < card.points
                                ? "linear-gradient(90deg, var(--color-brand-gold), #ffc107)"
                                : "rgba(255,255,255,0.06)",
                              border: i < card.points ? "none" : "1px solid rgba(255,255,255,0.08)",
                              transition: "all 0.3s",
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                        <span>آخر مسح: {card.lastScanAt ? new Date(card.lastScanAt).toLocaleDateString("ar") : "لا يوجد"}</span>
                        <span>انضم: {card.createdAt ? new Date(card.createdAt).toLocaleDateString("ar") : "—"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT RECIPE MODAL */}
      {editingRecipe && (
        <div className="modal-overlay" onClick={() => setEditingRecipe(null)}>
          <div
            className="modal-content animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "680px", width: "100%", margin: "auto" }}
          >
            <button className="modal-close" onClick={() => setEditingRecipe(null)}>
              &times;
            </button>

            <h3 style={{ fontWeight: 800, color: "var(--color-brand-gold)", fontSize: "1.2rem", marginBottom: "0.35rem" }}>
              ✏️ تعديل وصفة ({editingRecipe.title || "وصفة جديدة"})
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              أدخل رابط فيديو YouTube أو فيديو مباشر، وعدّل تفاصيل الوصفة والصنف ثم اضغط حفظ.
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
              <div className="responsive-two-column-grid">
                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                    🥩 صنف اللحم المرتبط بالوصفة:
                  </label>
                  <select
                    className="form-input"
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    style={{ background: "#111", color: "white", padding: "0.5rem", fontWeight: 700 }}
                  >
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon} {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">عنوان الوصفة:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="مثال: ستيك ريب آي بصلصة الزبدة..."
                    required
                  />
                </div>
              </div>

              {/* Video URL */}
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                  🎥 رابط فيديو الشرح (YouTube أو رابط مباشر MP4):
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ direction: "ltr" }}
                />
              </div>

              {/* Times */}
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

              {/* Ingredients */}
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                  📋 المكونات والمقادير الكاملة (مكون واحد في كل سطر):
                </label>
                <textarea
                  className="form-input"
                  rows={5}
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  style={{ resize: "vertical" }}
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
                {savingRecipe ? "جاري حفظ التغييرات..." : "💾 حفظ الوصفة"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
