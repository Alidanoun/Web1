import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

const DEFAULT_SETTINGS: Record<string, string> = {
  siteTitle: "ملاحم ومطاعم المركزية",
  siteSubtitle: "اختر صنف اللحوم أو الدجاج المفضل لديك واكتشف أسرار تتبيل وطهي أصنافنا الفاخرة.",
  meatTabLabel: "قسم اللحوم الحمراء",
  chickenTabLabel: "قسم الدجاج والطيور",
  allTabLabel: "جميع الأصناف",
};

export async function GET() {
  try {
    await ensureTablesExist();
    const settingsList = await prisma.siteSetting.findMany();
    const settings = { ...DEFAULT_SETTINGS };
    settingsList.forEach((s) => {
      if (s.key && s.value) {
        settings[s.key] = s.value;
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTablesExist();
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ success: false, error: "بيانات غير صالحة" }, { status: 400 });
    }

    const updates = Object.keys(settings).map((key) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(settings[key]) },
        create: { key, value: String(settings[key]) },
      })
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true, message: "تم حفظ الإعدادات بنجاح" });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ success: false, error: "فشل حفظ الإعدادات" }, { status: 500 });
  }
}
