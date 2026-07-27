import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import { recipes as defaultRecipes } from "@/data/recipes";

// GET /api/packages — returns recommended packages
export async function GET() {
  try {
    await ensureTablesExist();
    const dbPackages = await prisma.package.findMany();
    if (dbPackages && dbPackages.length > 0) {
      return NextResponse.json({ success: true, packages: dbPackages }, { status: 200 });
    }
  } catch (err) {
    console.warn("DB packages fetch warning:", err);
  }

  // Fallback: generate basic packages from static data
  const fallbackPackages = [
    { id: "group-1", name: "مجموعة 1-2 أشخاص", description: "مناسبة للفرد أو الزوجين", kebab: "250g", ribs: "200g", burger: "1 حبة", steak: "1 حبة", notes: "مثالية للوجبة الخفيفة", updatedAt: new Date() },
    { id: "group-2", name: "مجموعة 3-4 أشخاص", description: "مناسبة للعائلة الصغيرة", kebab: "500g", ribs: "400g", burger: "2 حبة", steak: "2 حبة", notes: "مثالية لغداء عائلي", updatedAt: new Date() },
    { id: "group-3", name: "مجموعة 5-6 أشخاص", description: "للعائلة المتوسطة", kebab: "750g", ribs: "600g", burger: "3 حبة", steak: "3 حبة", notes: "مثالية لوجبة العشاء", updatedAt: new Date() },
    { id: "group-4", name: "مجموعة 7-10 أشخاص", description: "للعائلة الكبيرة", kebab: "1kg", ribs: "800g", burger: "4 حبة", steak: "4 حبة", notes: "مثالية للتجمعات العائلية", updatedAt: new Date() },
    { id: "group-5", name: "مجموعة +10 أشخاص", description: "للمناسبات والأفراح", kebab: "2kg", ribs: "1.5kg", burger: "8 حبة", steak: "6 حبة", notes: "مثالية للمناسبات الكبيرة", updatedAt: new Date() },
  ];

  return NextResponse.json({ success: true, packages: fallbackPackages }, { status: 200 });
}

// PUT /api/packages — create or update a package
export async function PUT(req: Request) {
  try {
    await ensureTablesExist();
    const body = await req.json();
    const { id, name, description, kebab, ribs, burger, steak, notes } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "معرّف الباقة والاسم مطلوبان" }, { status: 400 });
    }

    const updated = await prisma.package.upsert({
      where: { id },
      update: { name, description: description || "", kebab: kebab || "", ribs: ribs || "", burger: burger || "", steak: steak || "", notes: notes || "" },
      create: { id, name, description: description || "", kebab: kebab || "", ribs: ribs || "", burger: burger || "", steak: steak || "", notes: notes || "" },
    });

    return NextResponse.json({ success: true, package: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: "فشل حفظ الباقة" }, { status: 500 });
  }
}
