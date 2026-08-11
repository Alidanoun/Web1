import { neon } from "@neondatabase/serverless";
import { recipes } from "./data/recipes";

const connectionString = "postgresql://neondb_owner:npg_EpbOdSm3P7ra@ep-weathered-forest-ax9ru7rm-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

const products = [
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

async function main() {
  console.log("Seeding 18 Products into Neon...");
  for (const p of products) {
    await (sql as any).query(
      `INSERT INTO "Product" ("id","name","weight","icon","imageUrl","sortOrder")
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT ("id") DO UPDATE SET "name"=$2, "weight"=$3, "icon"=$4, "imageUrl"=$5, "sortOrder"=$6`,
      [p.id, p.name, p.weight, p.icon, "", p.sortOrder]
    );
  }
  console.log("✓ 18 Products seeded!");

  console.log("Seeding Recipes into Neon...");
  for (const key of Object.keys(recipes)) {
    const r = (recipes as any)[key];
    await (sql as any).query(
      `INSERT INTO "Recipe" ("id","productId","title","category","icon","imageUrl","meatType","cuisine","description","prepTime","cookTime","difficulty","videoUrl","videoPlaceholder","ingredients","instructions","tips","marinade")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT ("id") DO UPDATE SET
         "productId"=$2, "title"=$3, "category"=$4, "icon"=$5, "imageUrl"=$6, "meatType"=$7, "cuisine"=$8,
         "description"=$9, "prepTime"=$10, "cookTime"=$11, "difficulty"=$12, "videoUrl"=$13, "videoPlaceholder"=$14,
         "ingredients"=$15, "instructions"=$16, "tips"=$17, "marinade"=$18, "updatedAt"=NOW()`,
      [
        r.id,
        r.productId || "",
        r.title,
        r.category,
        r.icon || "",
        r.imageUrl || "",
        r.meatType || "meat",
        r.cuisine || "arabic",
        r.description,
        r.prepTime,
        r.cookTime,
        r.difficulty,
        r.videoUrl || "",
        r.videoPlaceholder || "شاهد الفيديو",
        JSON.stringify(r.ingredients),
        JSON.stringify(r.instructions),
        JSON.stringify(r.tips),
        r.marinade || "",
      ]
    );
  }
  console.log("✓ All Recipes seeded!");

  const pCount = await (sql as any).query('SELECT COUNT(*) FROM "Product"');
  const rCount = await (sql as any).query('SELECT COUNT(*) FROM "Recipe"');
  console.log("FINAL NEON DB VERIFICATION:");
  console.log("Products Count in Neon:", pCount);
  console.log("Recipes Count in Neon:", rCount);
}

main();
