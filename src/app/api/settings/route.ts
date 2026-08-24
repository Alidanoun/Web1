import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

const DEFAULT_SETTINGS: Record<string, string> = {
  siteTitle: "ملاحم ومطاعم المركزية",
  siteSubtitle: "اختر صنف اللحوم أو الدجاج المفضل لديك واكتشف أسرار تتبيل وطهي أصنافنا الفاخرة.",
  meatTabLabel: "قسم اللحوم الحمراء",
  chickenTabLabel: "قسم الدجاج والطيور",
  allTabLabel: "جميع الأصناف",
};

// In-memory fallback cache so settings work seamlessly even without live DB
const memorySettings: Record<string, string> = { ...DEFAULT_SETTINGS };

// Cache settings at the Cloudflare edge for 5 minutes (they rarely change).
const CACHE_SECONDS = 300;

export async function GET() {
  try {
    await ensureTablesExist();
    const settingsList = await prisma.siteSetting.findMany();
    settingsList.forEach((s) => {
      if (s.key && s.value) {
        memorySettings[s.key] = s.value;
      }
    });
  } catch (error) {
    console.error("DB notice (GET settings): using memory cache.", error);
  }

  return NextResponse.json(
    { success: true, settings: memorySettings },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ success: false, error: "بيانات غير صالحة" }, { status: 400 });
    }

    // Always update memory cache immediately
    Object.keys(settings).forEach((key) => {
      memorySettings[key] = String(settings[key]);
    });

    // Try persisting to DB
    try {
      await ensureTablesExist();
      const updates = Object.keys(settings).map((key) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value: String(settings[key]) },
          create: { key, value: String(settings[key]) },
        })
      );
      await Promise.all(updates);
    } catch (dbErr) {
      console.error("DB notice (POST settings): saved to memory cache.", dbErr);
    }

    return NextResponse.json({ success: true, message: "تم حفظ الإعدادات بنجاح" });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ success: false, error: "فشل حفظ الإعدادات" }, { status: 500 });
  }
}
