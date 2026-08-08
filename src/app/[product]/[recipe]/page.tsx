import { notFound } from "next/navigation";
import Link from "next/link";
import { recipes as staticRecipes } from "@/data/recipes";
import { prisma } from "@/lib/db";
import RecipeSteps from "@/components/RecipeSteps";
import Doneness from "@/components/Doneness";
import StarRating from "@/components/StarRating";
import LeadForm from "@/components/LeadForm";
import OrderModal from "@/components/OrderModal";
import LoyaltyTracker from "@/components/LoyaltyTracker";
import VideoPlayer from "@/components/VideoPlayer";
import ScanTracker from "@/components/ScanTracker";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

interface PageProps {
  params: Promise<{ product: string; recipe: string }>;
  searchParams: Promise<{ source?: string }>;
}

export default async function RecipeDetailPage({ params, searchParams }: PageProps) {
  const { product, recipe: recipeIdParam } = await params;
  const { source } = await searchParams;
  const productId = product.toLowerCase();
  const recipeId = recipeIdParam.toLowerCase();

  // 1. Resolve product recipe from DB (or fallback to static data)
  let recipe: any = null;
  try {
    const dbRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (dbRecipe) {
      recipe = {
        id: dbRecipe.id,
        title: dbRecipe.title,
        category: dbRecipe.category,
        icon: dbRecipe.icon || "",
        imageUrl: dbRecipe.imageUrl || "",
        description: dbRecipe.description,
        prepTime: dbRecipe.prepTime,
        cookTime: dbRecipe.cookTime,
        difficulty: dbRecipe.difficulty,
        videoPlaceholder: dbRecipe.videoPlaceholder,
        videoUrl: dbRecipe.videoUrl,
        ingredients: JSON.parse(dbRecipe.ingredients || "[]"),
        instructions: JSON.parse(dbRecipe.instructions || "[]"),
        tips: JSON.parse(dbRecipe.tips || "[]"),
        marinade: dbRecipe.marinade,
        doneness: dbRecipe.doneness ? JSON.parse(dbRecipe.doneness) : (staticRecipes[recipeId]?.doneness || undefined),
        recommendedWeights: dbRecipe.recommendedWeights ? JSON.parse(dbRecipe.recommendedWeights) : undefined,
      };
    }
  } catch (err) {
    console.error("DB Recipe lookup failed, falling back to static recipes:", err);
  }

  if (!recipe) {
    recipe = staticRecipes[recipeId];
  }

  // If recipe still not found, show 404
  if (!recipe) {
    notFound();
  }

  return (
    <div className="container animate-fade-in">
      <ScanTracker productId={recipeId} />
      {/* Back to Product Link */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <Link
          href={`/${productId}`}
          style={{
            color: "var(--color-brand-gold)",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span>←</span> عودة إلى الوصفات
        </Link>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>مطاعم وملاحم المركزية</span>
      </div>

      {/* Header Brand Section */}
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        {/* Animated Double Gold Ring Logo */}
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
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "white",
            marginBottom: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          أهلاً بك في عالم اللحوم
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--color-text-muted)",
            maxWidth: "380px",
            margin: "0 auto 1.25rem auto",
            lineHeight: 1.5,
          }}
        >
          اكتشف أفضل طرق تحضير اللحوم مع وصفات احترافية من مطاعم وملاحم المركزية
        </p>

        <a href="#recipe-details" className="btn-gold" style={{ maxWidth: "250px", margin: "0 auto" }}>
          ابدأ الوصفة
        </a>
      </header>

      {/* Recipe details content anchor */}
      <main id="recipe-details" className="animate-slide-up" style={{ scrollMarginTop: "20px" }}>
        <div className="recipe-layout-grid">
          {/* Column 1: Video, Overview, Doneness & Interactive Actions */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Recipe Title & Info Card */}
            <div className="card card-gold-border">
              {recipe.imageUrl ? (
                <div style={{ marginBottom: "1rem", borderRadius: "12px", overflow: "hidden" }}>
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
                  />
                </div>
              ) : null}

              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--color-brand-gold)",
                  marginBottom: "0.75rem",
                }}
              >
                {recipe.title}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-light)", lineHeight: 1.5, marginBottom: "1rem" }}>
                {recipe.description}
              </p>

              <div className="recipe-meta-grid" style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", padding: "0.75rem", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ color: "var(--color-text-muted)", display: "block", fontSize: "0.8rem", marginBottom: "0.2rem" }}>التحضير</span>
                  <strong style={{ color: "white", fontSize: "0.95rem" }}>{recipe.prepTime || "-"}</strong>
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", padding: "0.75rem", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ color: "var(--color-text-muted)", display: "block", fontSize: "0.8rem", marginBottom: "0.2rem" }}>الطهي</span>
                  <strong style={{ color: "white", fontSize: "0.95rem" }}>{recipe.cookTime || "-"}</strong>
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", padding: "0.75rem", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ color: "var(--color-text-muted)", display: "block", fontSize: "0.8rem", marginBottom: "0.2rem" }}>الصعوبة</span>
                  <strong style={{ color: "white", fontSize: "0.95rem" }}>{recipe.difficulty || "-"}</strong>
                </div>
              </div>
            </div>

            {/* Video Player */}
            <VideoPlayer posterText={recipe.videoPlaceholder} videoUrl={recipe.videoUrl} />

            {/* Doneness Section (ONLY for steak) */}
            {recipe.doneness && (
              <div className="card">
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "var(--color-brand-gold)",
                    marginBottom: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>🥩</span> درجات الاستواء
                </h3>
                <Doneness levels={recipe.doneness} />
              </div>
            )}

            {/* Phase 3: Rating recipe */}
            <StarRating product={recipe.id} />

            {/* Phase 4: Direct Order Button */}
            <OrderModal product={recipe.id} />

            {/* Phase 5: Lead generation & Promo Code */}
            <LeadForm />
          </div>

          {/* Column 2: Loyalty Tracker, Marinade, Ingredients, Preparation Steps & Tips */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Loyalty Program Section (Phase 6) */}
            <LoyaltyTracker product={recipe.id} />

            {/* Seasoning / Marinade Section (طرق التتبيل) */}
            {recipe.marinade && (
              <div className="card">
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "var(--color-brand-gold)",
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>🧂</span> طريقة التتبيل الصحيحة
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-light)", lineHeight: 1.5 }}>
                  {recipe.marinade}
                </p>
              </div>
            )}

            {/* Ingredients Section (المقادير) */}
            <div className="card">
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "var(--color-brand-gold)",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>📋</span> المكونات والمقادير الكاملة
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                * علم على المكونات التي قمت بتجهيزها:
              </p>
              <RecipeSteps
                items={
                  Array.isArray(recipe.ingredients)
                    ? recipe.ingredients
                    : (recipe.ingredients["group-3"] || Object.values(recipe.ingredients)[0] || [])
                }
                type="ingredients"
              />
            </div>

            {/* Instructions Section (خطوات التحضير) */}
            <div className="card">
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "var(--color-brand-gold)",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>🍳</span> خطوات التحضير والطهي
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                * اتبع الخطوات وعلم على ما أنجزته:
              </p>
              <RecipeSteps items={recipe.instructions} type="instructions" />
            </div>

            {/* Cooking Tips Section (نصائح الطهي) */}
            {recipe.tips && recipe.tips.length > 0 && (
              <div className="card">
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "var(--color-brand-gold)",
                    marginBottom: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>💡</span> نصائح الطاهي الذهبية
                </h3>
                <ul style={{ paddingRight: "1rem", fontSize: "0.85rem", color: "var(--color-text-light)", lineHeight: 1.6 }}>
                  {recipe.tips.map((tip: string, index: number) => (
                    <li key={index} style={{ marginBottom: "0.5rem" }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding and Social Links */}
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
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.15)", marginBottom: "1rem" }}>
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
        </p>

        {/* Social Networks Follow */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", fontSize: "0.9rem" }}>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            Instagram
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            TikTok
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            Facebook
          </a>
        </div>
      </footer>
    </div>
  );
}
