import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { product, stars, comment } = await req.json();

    if (!product || typeof stars !== "number" || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const id = `rate_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await ensureTablesExist();
    await prisma.rating.create({
      data: {
        id,
        product: String(product),
        stars: Number(stars),
        comment: comment ? String(comment) : "",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Rating DB error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
