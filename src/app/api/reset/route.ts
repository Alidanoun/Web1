import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/reset - Clears all test scans, ratings, leads, and clicks for real production launch
export async function POST() {
  try {
    await prisma.scan.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.orderClick.deleteMany();

    return NextResponse.json({
      success: true,
      message: "تم تصفير وإعادة ضبط قاعدة البيانات بنجاح! أصبح النظام جاهزاً الآن لتلقي بيانات العملاء الحقيقية."
    }, { status: 200 });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json({ error: "فشل تصفير قاعدة البيانات" }, { status: 500 });
  }
}
