import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await ensureTablesExist();

    const { product } = await req.json();

    if (!product || typeof product !== "string") {
      return NextResponse.json({ error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    const cleanProduct = product.trim().toLowerCase();

    try {
      const scan = await prisma.scan.create({
        data: {
          id: crypto.randomUUID(),
          product: cleanProduct,
        },
      });
      return NextResponse.json({ success: true, scan }, { status: 200 });
    } catch (dbErr) {
      console.error("DB scan creation error:", dbErr);
      return NextResponse.json(
        { success: false, error: `فشل حفظ المسح بالداتا بيس: ${(dbErr as Error).message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error logging scan:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
