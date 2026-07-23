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
      await prisma.scan.create({
        data: {
          id: crypto.randomUUID(),
          product: cleanProduct,
        },
      });
    } catch (dbErr) {
      console.warn("DB scan logging warning:", dbErr);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error logging scan:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
