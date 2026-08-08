import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import { POST as resetPost } from "../reset/route";

export async function POST(req: Request) {
  try {
    await ensureTablesExist();

    // ── Seed Products (18 items from Excel) ──
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

    for (const p of products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: p,
        create: p,
      });
    }

    // Call existing reset logic
    return await resetPost();
  } catch (error) {
    console.error("Error in seed route:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
