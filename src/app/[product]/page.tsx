import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma, ensureTablesExist, runQuery } from "@/lib/db";
import ScanTracker from "@/components/ScanTracker";
import LeadForm from "@/components/LeadForm";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

interface PageProps {
  params: Promise<{ product: string }>;
  searchParams: Promise<{ source?: string }>;
}

const STATIC_PRODUCTS = [
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

export default async function ProductRecipesPage({ params, searchParams }: PageProps) {
  const { product } = await params;
  const { source } = await searchParams;
  const productId = product.toLowerCase();

  await ensureTablesExist();

  // 1. Get product from DB
  let productData = await prisma.product.findUnique({ where: { id: productId } });
  
  // Fallback to static list
  if (!productData) {
    const found = STATIC_PRODUCTS.find(p => p.id === productId);
    if (!found) notFound();
    productData = found as any;
  }

  // 2. Get recipes linked to this product
  let recipes: any[] = [];
  try {
    recipes = await runQuery(`SELECT * FROM "Recipe" WHERE "productId"=$1 ORDER BY "updatedAt" DESC`, [productId]);
  } catch (err) {
    console.error("Failed to fetch recipes for product:", err);
  }

  // 3. Render
  return (
    <div className="container animate-fade-in">
      <ScanTracker productId={productId} />
      
      {/* Back button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
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

      {/* Product header */}
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div className="logo-container" style={{ transform: "scale(0.8)", marginBottom: "-0.5rem" }}>
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

        <div className="card" style={{ display: "inline-block", padding: "1.5rem 2rem", marginTop: "1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
            {productData.imageUrl ? (
               <img src={productData.imageUrl} alt={productData.name} style={{width: 80, height: 80, borderRadius: "50%", objectFit: "cover"}} />
            ) : productData.icon}
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }}>
            {productData.name}
          </h1>
          {productData.weight && (
             <span className="badge badge-gold" style={{ fontSize: "0.9rem" }}>
               الوزن: {productData.weight}
             </span>
          )}
        </div>
      </header>

      <main>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            color: "var(--color-brand-gold)",
            marginBottom: "1.5rem",
            textAlign: "center"
          }}
        >
          🍳 وصفات تحضير {productData.name}
        </h3>

        {/* Recipes grid or empty state */}
        {recipes.length > 0 ? (
          <div className="grid-categories" style={{ marginBottom: "2.5rem" }}>
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/${productId}/${recipe.id}`}
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
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
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
                      <span style={{ fontSize: "2.5rem", flexShrink: 0 }}>{recipe.icon || "🥩"}</span>
                    )}
                    <div>
                      <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "white", marginBottom: "0.2rem" }}>
                        {recipe.title}
                      </h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                        {recipe.description || "اضغط لمشاهدة الوصفة كاملة"}
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
        ) : (
          <div className="card animate-slide-up" style={{ textAlign: "center", padding: "3rem 2rem", marginBottom: "2.5rem", border: "1px solid rgba(223, 138, 39, 0.2)" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🍳</div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }}>
              وصفات هذا الصنف قيد الإعداد
            </h3>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto" }}>
              نعمل على تجهيز أفضل الوصفات والطرق لتحضير {productData.name}. ترقبوا وصفاتنا المميزة قريباً!
            </p>
          </div>
        )}

        <div className="grid-two-column">
          <LeadForm />
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
