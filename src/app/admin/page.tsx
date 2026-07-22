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
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  videoPlaceholder: string;
  videoUrl?: string;
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
  const [activeTab, setActiveTab] = useState<"stats" | "recipes" | "qr" | "packages">("stats");
  const [domainHost, setDomainHost] = useState("http://recipes-markzia.ddns.net");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recipes, setRecipes] = useState<Record<string, RecipeData>>({});
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);

  // Package editing state
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);
  const [savingPackage, setSavingPackage] = useState(false);

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
  const [formWeights, setFormWeights] = useState<Record<string, string>>({
    "group-1": "",
    "group-2": "",
    "group-3": "",
    "group-4": "",
    "group-5": "",
  });
  const [formIngredientsMap, setFormIngredientsMap] = useState<Record<string, string>>({
    "group-1": "",
    "group-2": "",
    "group-3": "",
    "group-4": "",
    "group-5": "",
  });
  const [activeIngGroup, setActiveIngGroup] = useState("group-3");
  const [formInstructions, setFormInstructions] = useState("");
  const [formTips, setFormTips] = useState("");
  const [formMarinade, setFormMarinade] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError("فشل تحميل بيانات التحليلات.");
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

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      if (res.ok) {
        const data = await res.json();
        if (data.packages) {
          setPackages(data.packages);
        }
      }
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setDomainHost(window.location.origin);
    }
    Promise.all([fetchStats(), fetchRecipes(), fetchPackages()]).then(() => setLoading(false));
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
    setFormDesc(recipe.description);
    setFormPrep(recipe.prepTime);
    setFormCook(recipe.cookTime);
    setFormVideoUrl(recipe.videoUrl || "");
    setFormCuisine(recipe.cuisine || "arabic");

    const defaultMap = {
      "group-1": "",
      "group-2": "",
      "group-3": "",
      "group-4": "",
      "group-5": "",
    };

    if (recipe.ingredients) {
      if (Array.isArray(recipe.ingredients)) {
        const listText = recipe.ingredients.join("\n");
        defaultMap["group-1"] = listText;
        defaultMap["group-2"] = listText;
        defaultMap["group-3"] = listText;
        defaultMap["group-4"] = listText;
        defaultMap["group-5"] = listText;
      } else if (typeof recipe.ingredients === "object") {
        Object.keys(defaultMap).forEach((key) => {
          const val = recipe.ingredients[key];
          if (Array.isArray(val)) {
            defaultMap[key as keyof typeof defaultMap] = val.join("\n");
          }
        });
      }
    }
    setFormIngredientsMap(defaultMap);
    setActiveIngGroup("group-3");

    const defaultWeights = {
      "group-1": "",
      "group-2": "",
      "group-3": "",
      "group-4": "",
      "group-5": "",
    };
    if (recipe.recommendedWeights) {
      Object.keys(defaultWeights).forEach((key) => {
        defaultWeights[key as keyof typeof defaultWeights] = recipe.recommendedWeights[key] || "";
      });
    }
    setFormWeights(defaultWeights);

    setFormInstructions(recipe.instructions.join("\n"));
    setFormTips(recipe.tips.join("\n"));
    setFormMarinade(recipe.marinade);
    setSaveSuccess(false);
  };

  const handleAddNewRecipe = () => {
    const blankRecipe: RecipeData = {
      id: "",
      title: "",
      category: "أخرى",
      description: "",
      prepTime: "15 دقيقة",
      cookTime: "10 دقائق",
      difficulty: "سهل",
      videoPlaceholder: "شاهد طريقة التحضير",
      videoUrl: "",
      ingredients: {
        "group-1": [],
        "group-2": [],
        "group-3": [],
        "group-4": [],
        "group-5": [],
      },
      instructions: [],
      tips: [],
      marinade: "",
      cuisine: "arabic",
      recommendedWeights: {
        "group-1": "",
        "group-2": "",
        "group-3": "",
        "group-4": "",
        "group-5": "",
      },
    };
    openRecipeEditor(blankRecipe);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe) return;

    setSavingRecipe(true);
    setSaveSuccess(false);

    try {
      const parsedIngredientsMap: Record<string, string[]> = {};
      Object.keys(formIngredientsMap).forEach((key) => {
        parsedIngredientsMap[key] = formIngredientsMap[key]
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      });

      const updatedData = {
        id: formId ? formId.trim().toLowerCase() : (editingRecipe.id || "recipe-" + Date.now()),
        title: formTitle,
        description: formDesc,
        prepTime: formPrep,
        cookTime: formCook,
        difficulty: editingRecipe.difficulty || "متوسط",
        videoUrl: formVideoUrl,
        ingredients: parsedIngredientsMap,
        instructions: formInstructions.split("\n").map((s) => s.trim()).filter(Boolean),
        tips: formTips.split("\n").map((s) => s.trim()).filter(Boolean),
        marinade: formMarinade,
        cuisine: formCuisine,
        recommendedWeights: formWeights,
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
        alert("حدث خطأ أثناء حفظ التعديلات.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("فشل الاتصال بالخادم.");
    } finally {
      setSavingRecipe(false);
    }
  };

  // Package form fields
  const [formPkgName, setFormPkgName] = useState("");
  const [formPkgDesc, setFormPkgDesc] = useState("");
  const [formPkgKebab, setFormPkgKebab] = useState("");
  const [formPkgRibs, setFormPkgRibs] = useState("");
  const [formPkgBurger, setFormPkgBurger] = useState("");
  const [formPkgSteak, setFormPkgSteak] = useState("");
  const [formPkgNotes, setFormPkgNotes] = useState("");

  const openPackageEditor = (pkg: PackageData) => {
    setEditingPackage(pkg);
    setFormPkgName(pkg.name);
    setFormPkgDesc(pkg.description);
    setFormPkgKebab(pkg.kebab);
    setFormPkgRibs(pkg.ribs);
    setFormPkgBurger(pkg.burger);
    setFormPkgSteak(pkg.steak);
    setFormPkgNotes(pkg.notes);
    setSaveSuccess(false);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    setSavingPackage(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPackage.id,
          name: formPkgName,
          description: formPkgDesc,
          kebab: formPkgKebab,
          ribs: formPkgRibs,
          burger: formPkgBurger,
          steak: formPkgSteak,
          notes: formPkgNotes,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        fetchPackages();
        setTimeout(() => {
          setEditingPackage(null);
          setSaveSuccess(false);
        }, 1200);
      } else {
        alert("فشل حفظ الباقة.");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ.");
    } finally {
      setSavingPackage(false);
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
          className={`doneness-tab ${activeTab === "packages" ? "active" : ""}`}
          onClick={() => setActiveTab("packages")}
          style={{ fontSize: "0.95rem", padding: "0.6rem 1.25rem" }}
        >
          📦 باقات وحاسبة أوزان اللحوم
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
              <h4 style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.25rem 0" }}>إجمالي مسح الـ QR</h4>
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
              onClick={async () => {
                if (confirm("هل أنت تأكد من رغبتك في تصفير وقرص البيانات القديمة والبدء الحقيقي الآن؟")) {
                  setSeedLoading(true);
                  try {
                    const res = await fetch("/api/reset", { method: "POST" });
                    if (res.ok) {
                      alert("تم تصفير البيانات بنجاح! أصبح النظام جاهزاً للعملاء الحقيقيين 100%.");
                      fetchStats();
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setSeedLoading(false);
                  }
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
            <div className="card">
              <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-brand-gold)", marginBottom: "0.75rem" }}>
                📊 أداء المنتجات والوصفات
              </h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>مرات المسح</th>
                      <th>تقييم الوصفة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["steak", "burger", "kebab", "ribs"].map((p) => {
                      const label = p === "steak" ? "🥩 ستيك" : p === "burger" ? "🍔 برغر" : p === "kebab" ? "🔥 كباب" : "🍖 ريش";
                      const scanCount = stats.scans[p] || 0;
                      const ratingInfo = stats.ratings[p] || { count: 0, avg: 0 };
                      return (
                        <tr key={p}>
                          <td style={{ fontWeight: 700 }}>{label}</td>
                          <td>{scanCount}</td>
                          <td>
                            {ratingInfo.count > 0 ? (
                              <span style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                                ★ {ratingInfo.avg} <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>({ratingInfo.count} تقييم)</span>
                              </span>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)" }}>لا يوجد تقييم</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                          <td style={{ color: rate.comment ? "white" : "var(--color-text-muted)", fontStyle: rate.comment ? "normal" : "italic" }}>
                            {rate.comment || "بدون تعليق مضاف"}
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
          <div className="grid-categories">
            {[
              { id: "burger", title: "عبوة برغر المركزية", icon: "🍔", path: "/burger" },
              { id: "steak", title: "عبوة ستيك الريب آي", icon: "🥩", path: "/steak" },
              { id: "kebab", title: "عبوة الكباب البلدي", icon: "🔥", path: "/kebab" },
              { id: "ribs", title: "عبوة ريش الغنم", icon: "🍖", path: "/ribs" },
              { id: "tenderloin", title: "عبوة ستيك التندرلوين", icon: "🍽️", path: "/tenderloin" },
              { id: "kofta", title: "عبوة الكفتة بالصحن", icon: "🥘", path: "/kofta" },
              { id: "awsal", title: "عبوة أوصال اللحم", icon: "🍢", path: "/awsal" },
              { id: "smash", title: "عبوة برغر السماش", icon: "🧀", path: "/smash" },
              { id: "home", title: "الرمز العام (الصفحة الرئيسية)", icon: "🏠", path: "/" },
              { id: "loyalty", title: "رمز جمع نقاط الولاء (يُعلق في الملحمة)", icon: "🦁", path: "/collect" },
            ].map((prod) => {
              const isRecipe = prod.path !== "/" && prod.path !== "/collect";
              const fullUrl = `${domainHost.replace(/\/$/, "")}${prod.path}${isRecipe ? "?source=qr" : ""}`;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(fullUrl)}`;

              return (
                <div key={prod.id} className="card card-gold-border" style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "2rem", display: "block" }}>{prod.icon}</span>
                  <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "white", margin: "0.35rem 0" }}>
                    {prod.title}
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", direction: "ltr" }}>
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
                    <img src={qrImageUrl} alt={prod.title} style={{ width: "160px", height: "160px", display: "block" }} />
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                    {prod.id !== "home" && prod.id !== "loyalty" ? (
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
                    ) : (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "var(--color-text-muted)",
                          borderRadius: "8px",
                          padding: "0.5rem",
                          fontSize: "0.85rem",
                          textAlign: "center"
                        }}
                      >
                        صالح للمسح المباشر
                      </div>
                    )}

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

      {/* TAB 4: MEAT PACKAGES & CALCULATOR MANAGEMENT */}
      {activeTab === "packages" && (
        <div className="animate-fade-in">
          <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", marginBottom: "0.5rem" }}>
            📦 إدارة باقات وحاسبة أوزان اللحوم
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            عدّل الكميات والأوزان والنصائح المقترحة لكل فئة من فئات جمعات الشواء والعزائم.
          </p>

          <div className="grid-categories">
            {packages.map((pkg) => (
              <div key={pkg.id} className="card card-gold-border" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--color-brand-gold)", marginBottom: "0.5rem" }}>
                    👑 {pkg.name}
                  </h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                    {pkg.description}
                  </p>
                  <ul style={{ fontSize: "0.8rem", color: "white", listStyle: "none", padding: 0, marginBottom: "1rem" }}>
                    <li>🍢 كباب: <strong>{pkg.kebab || "—"}</strong></li>
                    <li>🍖 ريش: <strong>{pkg.ribs || "—"}</strong></li>
                    <li>🍔 برغر: <strong>{pkg.burger || "—"}</strong></li>
                    <li>🥩 ستيك: <strong>{pkg.steak || "—"}</strong></li>
                  </ul>
                </div>
                <button
                  className="btn-gold"
                  onClick={() => openPackageEditor(pkg)}
                  style={{ fontSize: "0.85rem", padding: "0.6rem" }}
                >
                  ✏️ تعديل أوزان الباقة
                </button>
              </div>
            ))}
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
              {/* Recipe ID (Only editable for new recipes) */}
              <div className="form-group">
                <label className="form-label">معرّف الوصفة (ID بالإنجليزية - فريد):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: premium-kebab أو ribs-special (بدون مسافات)"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                  disabled={!!editingRecipe.id}
                  required
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                {!editingRecipe.id && (
                  <span style={{ fontSize: "0.72rem", color: "var(--color-brand-gold)" }}>
                    * يحدد هذا المعرف رابط صفحة الـ QR (مثال: recipes-markzia.ddns.net/premium-kebab). لا يمكن تعديله بعد الحفظ.
                  </span>
                )}
              </div>

              {/* Cuisine Selector */}
              <div className="form-group">
                <label className="form-label">تصنيف المطبخ (Cuisine):</label>
                <select
                  className="form-input"
                  value={formCuisine}
                  onChange={(e) => setFormCuisine(e.target.value)}
                  style={{ background: "#111", color: "white", padding: "0.5rem" }}
                >
                  <option value="arabic">🇦🇪 🇸🇦 عربي وشرقي</option>
                  <option value="international">🌎 عالمي / إنترناشيونال</option>
                </select>
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

              {/* Recommended Meat Weights (الكميات المقترحة من اللحم الرئيسي) */}
              <div className="form-group" style={{ border: "1px solid rgba(223, 138, 39, 0.2)", padding: "1rem", borderRadius: "8px", background: "rgba(223, 138, 39, 0.02)" }}>
                <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700, marginBottom: "0.75rem", display: "block" }}>
                  ⚖️ أوزان وكميات اللحوم الموصى بها (حسب الفئة):
                </label>
                <div className="responsive-two-column-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>👤 لشخص واحد:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="مثال: 300 غرام"
                      value={formWeights["group-1"] || ""}
                      onChange={(e) => setFormWeights({ ...formWeights, "group-1": e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>👥 لشخصين:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="مثال: 500 غرام"
                      value={formWeights["group-2"] || ""}
                      onChange={(e) => setFormWeights({ ...formWeights, "group-2": e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>👨‍👩‍👦 لـ 3-5 أشخاص:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="مثال: 1.0 كيلو غرام"
                      value={formWeights["group-3"] || ""}
                      onChange={(e) => setFormWeights({ ...formWeights, "group-3": e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>👨‍👩‍👧‍👦 لـ 5-7 أشخاص:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="مثال: 1.5 كيلو غرام"
                      value={formWeights["group-4"] || ""}
                      onChange={(e) => setFormWeights({ ...formWeights, "group-4": e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.75rem" }}>👑 لوليمة (8+ أشخاص):</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: 2.5 كيلو غرام"
                    value={formWeights["group-5"] || ""}
                    onChange={(e) => setFormWeights({ ...formWeights, "group-5": e.target.value })}
                  />
                </div>
              </div>

              {/* Ingredients (المكونات والمقادير حسب عدد الأشخاص) */}
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-brand-gold)", fontWeight: 700 }}>
                  📋 المكونات والمقادير (حسب عدد الأشخاص):
                </label>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                  * اختر المجموعة لتعديل مقاديرها (مكون واحد في كل سطر):
                </p>

                {/* Sub-tabs for group-specific ingredients */}
                <div className="scroll-tabs-container" style={{ marginBottom: "0.5rem", paddingBottom: "0.25rem" }}>
                  {[
                    { id: "group-1", name: "👤 شخص" },
                    { id: "group-2", name: "👥 شخصين" },
                    { id: "group-3", name: "👨‍👩‍👦 3-5" },
                    { id: "group-4", name: "👨‍👩‍👧‍👦 5-7" },
                    { id: "group-5", name: "👑 وليمة (8+)" },
                  ].map((gp) => (
                    <button
                      key={gp.id}
                      type="button"
                      onClick={() => setActiveIngGroup(gp.id)}
                      className={`scroll-tab-btn ${activeIngGroup === gp.id ? "active" : ""}`}
                      style={{ padding: "0.35rem 0.6rem" }}
                    >
                      {gp.name}
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-input"
                  rows={5}
                  value={formIngredientsMap[activeIngGroup] || ""}
                  onChange={(e) => {
                    setFormIngredientsMap({
                      ...formIngredientsMap,
                      [activeIngGroup]: e.target.value,
                    });
                  }}
                  style={{ resize: "vertical", borderColor: "rgba(223, 138, 39, 0.4)" }}
                  placeholder="اكتب المكونات هنا... مثلاً:&#10;1.0 كيلو غرام لحم مفروم&#10;3 حبات بصل مفروم&#10;ملعقة ملح صغيرة"
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

      {/* EDIT PACKAGE MODAL */}
      {editingPackage && (
        <div className="modal-overlay" onClick={() => setEditingPackage(null)}>
          <div
            className="modal-content animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <button className="modal-close" onClick={() => setEditingPackage(null)}>
              &times;
            </button>

            <h3 style={{ fontWeight: 800, color: "var(--color-brand-gold)", fontSize: "1.2rem", marginBottom: "0.35rem" }}>
              ✏️ تعديل أوزان باقة ({editingPackage.name})
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              عدل الكميات الموصى بها والنصائح ثم اضغط حفظ.
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
                ✓ تم حفظ أوزان الباقة بنجاح!
              </div>
            )}

            <form onSubmit={handleSavePackage}>
              <div className="form-group">
                <label className="form-label">اسم الباقة:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formPkgName}
                  onChange={(e) => setFormPkgName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">الوصف التفصيلي للباقة:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formPkgDesc}
                  onChange={(e) => setFormPkgDesc(e.target.value)}
                />
              </div>

              <div className="responsive-two-column-grid">
                <div className="form-group">
                  <label className="form-label">🍢 وزن/كمية الكباب البلدي:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPkgKebab}
                    onChange={(e) => setFormPkgKebab(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🍖 وزن/كمية الريش البلدي:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPkgRibs}
                    onChange={(e) => setFormPkgRibs(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🍔 وزن/عدد البرغر البلدي:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPkgBurger}
                    onChange={(e) => setFormPkgBurger(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🥩 وزن/قطعة ستيك الريب آي:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPkgSteak}
                    onChange={(e) => setFormPkgSteak(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">💡 ملاحظة ونصيحة الطاهي للباقة:</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formPkgNotes}
                  onChange={(e) => setFormPkgNotes(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button type="submit" className="btn-gold" disabled={savingPackage} style={{ marginTop: "0.5rem" }}>
                {savingPackage ? "جاري الحفظ..." : "💾 حفظ أوزان الباقة"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
