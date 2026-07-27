import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import { recordMemoryScan } from "@/lib/trackingStore";

export async function POST(req: Request) {
  try {
    await ensureTablesExist();

    const { product } = await req.json();

    if (!product || typeof product !== "string") {
      return NextResponse.json({ error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    const cleanProduct = product.trim().toLowerCase();
    const memoryScan = recordMemoryScan(cleanProduct);

    try {
      const scan = await prisma.scan.create({
        data: {
          id: memoryScan.id,
          product: cleanProduct,
        },
      });
      return NextResponse.json({ success: true, scan }, { status: 200 });
    } catch (dbErr) {
      console.warn("DB notice (POST scan): saved to memory store.", dbErr);
      return NextResponse.json({ success: true, scan: memoryScan }, { status: 200 });
    }
  } catch (error) {
    console.error("Error logging scan:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
