import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { product, source } = await req.json();

    if (!product || typeof product !== "string") {
      return NextResponse.json({ error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    const cleanProduct = product.trim().toLowerCase();
    const scanSource = source === "qr" ? "qr" : "direct";
    const id = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await ensureTablesExist();
    await prisma.scan.create({ data: { id, product: cleanProduct, source: scanSource } });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    // Even on DB error, log and return success so client doesn't see broken UX
    console.error("Scan DB error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
