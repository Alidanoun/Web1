import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { product, platform } = await req.json();

    if (!product || !platform) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const id = `click_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await ensureTablesExist();
    await prisma.orderClick.create({
      data: { id, product: String(product), platform: String(platform) },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Click DB error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
