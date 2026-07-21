import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Purge test data for production
    await prisma.scan.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.orderClick.deleteMany();

    return NextResponse.json({ success: true, message: "تم تصفير البيانات التجريبية وبدء التشغيل الحقيقي!" }, { status: 200 });
  } catch (error) {
    console.error("Error clearing DB:", error);
    return NextResponse.json({ error: "فشل تصفير قاعدة البيانات" }, { status: 500 });
  }
}
