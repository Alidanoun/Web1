import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { product, platform } = await req.json();

    if (!product || !platform) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const click = await prisma.orderClick.create({
      data: {
        product: String(product),
        platform: String(platform),
      },
    });

    return NextResponse.json({ success: true, click }, { status: 201 });
  } catch (error) {
    console.error("Error logging click:", error);
    return NextResponse.json({ error: "فشل تسجيل النقرة" }, { status: 500 });
  }
}
