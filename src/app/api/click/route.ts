import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import { recordMemoryClick } from "@/lib/trackingStore";

export async function POST(req: Request) {
  try {
    await ensureTablesExist();

    const { product, platform } = await req.json();

    if (!product || !platform) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const memoryClick = recordMemoryClick(String(product), String(platform));

    try {
      await prisma.orderClick.create({
        data: {
          id: memoryClick.id,
          product: String(product),
          platform: String(platform),
        },
      });
    } catch (dbErr) {
      console.warn("Click save warning:", dbErr);
    }

    return NextResponse.json({ success: true, click: memoryClick }, { status: 201 });
  } catch (error) {
    console.error("Error logging click:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
