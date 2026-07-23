import { notFound } from "next/navigation";
import Link from "next/link";
import { recipes } from "@/data/recipes";
import { prisma } from "@/lib/db";
import RecipeSteps from "@/components/RecipeSteps";
import Doneness from "@/components/Doneness";
import StarRating from "@/components/StarRating";
import LeadForm from "@/components/LeadForm";
import OrderModal from "@/components/OrderModal";
import LoyaltyTracker from "@/components/LoyaltyTracker";
import VideoPlayer from "@/components/VideoPlayer";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

interface PageProps {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ source?: string }>;
}

export default async function ProductRecipePage({ params, searchParams }: PageProps) {
  const { product } = await params;
  const { source } = await searchParams;
  const productId = product.toLowerCase();

  // 1. Resolve product recipe from DB (or fallback to static data)
  let recipe: any = null;
  try {
    const dbRecipe = await prisma.recipe.findUnique({
      where: { id: productId },
    });
    if (dbRecipe) {
      recipe = {
        id: dbRecipe.id,
        title: dbRecipe.title,
        category: dbRecipe.category,
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
        doneness: dbRecipe.doneness ? JSON.parse(dbRecipe.doneness) : (recipes[productId]?.doneness || undefined),
        recommendedWeights: dbRecipe.recommendedWeights ? JSON.parse(dbRecipe.recommendedWeights) : undefined,
      };
    }
  } catch (err) {
    console.error("DB Recipe lookup failed, falling back to static recipes:", err);
  }

  if (!recipe) {
    recipe = recipes[productId];
  }

  // If recipe still not found, show 404
  if (!recipe) {
    notFound();
  }

  // 2. Register the scan in database only if source is 'qr' (Server Component direct database write!)
  if (source === "qr") {
    try {
      await prisma.scan.create({
        data: {
          product: productId,
        },
      });
    } catch (error) {
      console.error("Failed to log scan to DB:", error);
    }
  }

  return (
    <div className="container animate-fade-in">
      {/* Back to Home Link */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <Link
          href="/"
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
          <span>←</span> الصفحة الرئيسية
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

              <div className="recipe-meta-grid">
                <div>
                  <span style={{ color: "var(--color-text-muted)", display: "block" }}>التحضير</span>
                  <strong style={{ color: "white" }}>{recipe.prepTime}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)", display: "block" }}>الطهي</span>
                  <strong style={{ color: "white" }}>{recipe.cookTime}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)", display: "block" }}>الصعوبة</span>
                  <strong style={{ color: "white" }}>{recipe.difficulty}</strong>
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
