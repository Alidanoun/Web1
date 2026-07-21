import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Default Initial Packages data
const INITIAL_PACKAGES = [
  {
    id: "group-1",
    name: "وجبة لشخص واحد 👤",
    description: "وجبة مشبعة ومثالية لشخص واحد من قطعيات اللحوم الطازجة.",
    kebab: "300 غرام",
    ribs: "—",
    burger: "1 حبة برغر بلدي",
    steak: "—",
    notes: "تقدم مع خبز ملاحم المركزية وتشكيلة خضار للشواء.",
  },
  {
    id: "group-2",
    name: "باقة الثنائي المميزة 👥",
    description: "باقة متكاملة ومنسقة للمشاركة اللذيذة بين شخصين.",
    kebab: "500 غرام",
    ribs: "—",
    burger: "2 حبة برغر بلدي",
    steak: "—",
    notes: "تشمل المقبلات والخضار اللازمة للشواء الفوري.",
  },
  {
    id: "group-3",
    name: "جمعة العيلة والأصدقاء (3-5 أشخاص) 👨‍👩‍👦",
    description: "الباقة الأكثر طلباً للجمعات العائلية الصغيرة وعطل نهاية الأسبوع.",
    kebab: "1.0 كيلو غرام",
    ribs: "500 غرام ريش بلدي",
    burger: "4 حبات برغر بلدي",
    steak: "—",
    notes: "مناسبة لشواء عائلي مميز وسريع في المنزل.",
  },
  {
    id: "group-4",
    name: "جمعة اللمة والشباب (5-7 أشخاص) 👨‍👩‍👧‍👦",
    description: "باقة غنية وسخية تلبي رغبات الجميع وتكفي السهرة واللمة الطيبة.",
    kebab: "1.5 كيلو غرام",
    ribs: "1.0 كيلو غرام ريش",
    burger: "6 حبات برغر بلدي",
    steak: "—",
    notes: "تتضمن مقبلات مجانية وتشكيلة خضار شواء طازجة.",
  },
  {
    id: "group-5",
    name: "وليمة المركزية الكبرى (8+ أشخاص) 👑",
    description: "الباقة الملكية الكبرى للولائم والعزائم العامرة والمناسبات السعيدة.",
    kebab: "2.5 كيلو غرام",
    ribs: "1.5 كيلو غرام ريش بلدي",
    burger: "10 حبات برغر بلدي",
    steak: "4 قطع ستيك ريب آي",
    notes: "باقة الضيافة الفاخرة التي تبيض الوجه أمام ضيوفك.",
  },
];

// Helper to seed packages if empty
async function ensurePackagesExist() {
  const count = await prisma.package.count();
  if (count === 0) {
    for (const pkg of INITIAL_PACKAGES) {
      await prisma.package.create({
        data: pkg,
      });
    }
  }
}

// GET /api/packages - Returns all packages
export async function GET() {
  try {
    await ensurePackagesExist();
    const pkgs = await prisma.package.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, packages: pkgs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: "فشل تحميل الباقات والكميات" }, { status: 500 });
  }
}

// PUT /api/packages - Updates a package
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, kebab, ribs, burger, steak, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "معرّف الباقة مطلوب" }, { status: 400 });
    }

    const updatedPkg = await prisma.package.update({
      where: { id },
      data: {
        name,
        description,
        kebab: kebab || "",
        ribs: ribs || "",
        burger: burger || "",
        steak: steak || "",
        notes: notes || "",
      },
    });

    return NextResponse.json({ success: true, package: updatedPkg }, { status: 200 });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: "فشل تحديث بيانات الباقة" }, { status: 500 });
  }
}
