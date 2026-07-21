"use client";

import { useEffect, useState } from "react";

interface Package {
  id: string;
  name: string;
  description: string;
  kebab: string;
  ribs: string;
  burger: string;
  steak: string;
  notes: string;
}

// Mapping of recipe product ID to which package field to highlight
const RECIPE_PACKAGE_MAP: Record<string, { field: keyof Package; label: string; icon: string }> = {
  kebab: { field: "kebab", label: "كباب بلدي المركزية", icon: "🍢" },
  kofta: { field: "kebab", label: "كفتة بلدي", icon: "🥘" },
  awsal: { field: "kebab", label: "أوصال لحم بلدي", icon: "🍢" },
  ribs: { field: "ribs", label: "ريش غنم بلدي", icon: "🍖" },
  steak: { field: "steak", label: "ستيك ريب آي", icon: "🥩" },
  tenderloin: { field: "steak", label: "ستيك تندرلوين", icon: "🍽️" },
  burger: { field: "burger", label: "برغر بلدي المركزية", icon: "🍔" },
  smash: { field: "burger", label: "برغر سماش المركزية", icon: "🧀" },
};

// Human-readable labels for each group
const GROUP_LABELS: Record<string, string> = {
  "group-1": "👤 شخص واحد",
  "group-2": "👥 شخصين",
  "group-3": "👨‍👩‍👦 3 - 5 أشخاص",
  "group-4": "👨‍👩‍👧‍👦 5 - 7 أشخاص",
  "group-5": "👑 وليمة (8+)",
};

interface RecipeQuantityCalculatorProps {
  productId: string;
  recipeTitle: string;
  ingredients: any;
  recommendedWeights?: any;
}

export default function RecipeQuantityCalculator({
  productId,
  recipeTitle,
  ingredients,
  recommendedWeights,
}: RecipeQuantityCalculatorProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedId, setSelectedId] = useState("group-3");
  const [loading, setLoading] = useState(true);

  const recipeMapping = RECIPE_PACKAGE_MAP[productId];

  // Helper to extract active ingredients list for selected group
  const getActiveIngredients = (): string[] => {
    if (!ingredients) return [];
    if (Array.isArray(ingredients)) {
      return ingredients;
    }
    // If it's a map of group IDs to string arrays
    if (typeof ingredients === "object") {
      const list = ingredients[selectedId];
      if (Array.isArray(list)) return list;
      
      // Fallback: search for first available group's ingredients list
      const keys = Object.keys(ingredients);
      if (keys.length > 0) {
        const fallback = ingredients[keys[0]];
        if (Array.isArray(fallback)) return fallback;
      }
    }
    return [];
  };

  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch("/api/packages");
        const data = await res.json();
        if (res.ok && data.packages) {
          setPackages(data.packages);
        }
      } catch (err) {
        console.error("Error loading packages:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  // Don't render if this recipe isn't in the mapping
  if (!recipeMapping) return null;
  
  const isReallyLoading = loading && !recommendedWeights;
  if (isReallyLoading) return null;

  const activePkg = packages.find((p) => p.id === selectedId);
  
  let recommendedQty = "—";
  if (recommendedWeights && recommendedWeights[selectedId]) {
    recommendedQty = recommendedWeights[selectedId];
  } else if (activePkg) {
    recommendedQty = activePkg[recipeMapping.field] as string;
  }

  // WhatsApp order message including recipe name and all ingredients
  const getWhatsAppLink = () => {
    const phoneNumber = "962799999999";
    const groupName = GROUP_LABELS[selectedId] || selectedId;
    const activeIngs = getActiveIngredients();

    const ingredientsList = activeIngs
      .slice(0, 5) // show first 5 ingredients for brevity
      .map((ing) => `  - ${ing}`)
      .join("\n");

    const message =
      `مرحباً ملاحم ومطاعم المركزية! 🥩\n\n` +
      `أريد الطلب بناءً على وصفة *${recipeTitle}*\n` +
      `للفئة: *${groupName}*\n\n` +
      `الكمية الموصى بها من *${recipeMapping.label}*:\n` +
      `✅ ${recommendedQty !== "—" ? recommendedQty : "يرجى التأكيد"}\n\n` +
      `*مكونات الوصفة التي أحتاجها:*\n${ingredientsList}\n` +
      (activeIngs.length > 5 ? `  ... و${activeIngs.length - 5} مكونات أخرى\n` : "") +
      `\nيرجى تأكيد الطلب وتحديد موعد الاستلام أو التوصيل. شكراً! 🙏`;

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div
      className="card"
      style={{
        border: "1px solid rgba(223, 138, 39, 0.35)",
        background: "linear-gradient(135deg, rgba(223,138,39,0.05) 0%, rgba(10,10,10,0) 100%)",
        marginTop: "1rem",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h3
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "var(--color-brand-gold)",
            marginBottom: "0.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <span>{recipeMapping.icon}</span>
          كم أحتاج من {recipeMapping.label}؟
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
          اختر عدد الأشخاص وسنحسب لك الكمية المثالية من <strong style={{ color: "white" }}>{recipeTitle}</strong> للحصول على نتيجة مطاعم فاخرة في منزلك.
        </p>
      </div>

      {/* Group Selector Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          overflowX: "auto",
          paddingBottom: "0.75rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid var(--color-border)",
          scrollbarWidth: "none",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedId(pkg.id)}
            className={`doneness-tab ${selectedId === pkg.id ? "active" : ""}`}
            style={{
              fontSize: "0.78rem",
              padding: "0.45rem 0.85rem",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {GROUP_LABELS[pkg.id] || pkg.name}
          </button>
        ))}
      </div>

      {/* Result Panel */}
      {activePkg && (
        <div className="animate-fade-in">
          {/* Highlighted Quantity Box */}
          <div
            style={{
              background: "rgba(223, 138, 39, 0.08)",
              border: "1px solid rgba(223, 138, 39, 0.3)",
              borderRadius: "10px",
              padding: "1rem 1.25rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                الكمية الموصى بها لـ {GROUP_LABELS[selectedId]}:
              </p>
              <p
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 900,
                  color: "var(--color-brand-gold)",
                  lineHeight: 1.2,
                }}
              >
                {recommendedQty && recommendedQty !== "—" ? recommendedQty : (
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                    لم يتم تحديد الكمية بعد
                  </span>
                )}
              </p>
            </div>
            <span style={{ fontSize: "2.5rem", opacity: 0.6 }}>{recipeMapping.icon}</span>
          </div>

          {/* Ingredients Preview */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--color-brand-gold)",
                marginBottom: "0.5rem",
              }}
            >
              📋 مكونات الوصفة الكاملة التي ستطلبها:
            </p>
            <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {getActiveIngredients().map((ing, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-text-light)",
                    padding: "0.25rem 0",
                    borderBottom: idx < getActiveIngredients().length - 1 ? "1px dashed rgba(255,255,255,0.06)" : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.4rem",
                  }}
                >
                  <span style={{ color: "var(--color-brand-gold)", marginTop: "1px", flexShrink: 0 }}>•</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Package Notes */}
          {activePkg.notes && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.4rem",
                fontSize: "0.78rem",
                color: "var(--color-text-muted)",
                marginBottom: "1rem",
                padding: "0.6rem 0.75rem",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "6px",
                borderRight: "3px solid var(--color-brand-gold)",
              }}
            >
              <span>💡</span>
              <span>{activePkg.notes}</span>
            </div>
          )}

          {/* WhatsApp CTA */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 700,
              padding: "0.8rem",
            }}
          >
            💬 اطلب مكونات وصفة {recipeTitle.split(" ")[0]} الآن عبر الواتساب
          </a>
        </div>
      )}
    </div>
  );
}
