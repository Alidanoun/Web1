import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { product, stars, comment } = await req.json();

    if (!product || typeof stars !== "number" || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const rating = await prisma.rating.create({
      data: {
        product: String(product),
        stars: Number(stars),
        comment: comment ? String(comment) : "",
      },
    });

    return NextResponse.json({ success: true, rating }, { status: 201 });
  } catch (error) {
    console.error("Error creating rating:", error);
    return NextResponse.json({ error: "فشل حفظ التقييم" }, { status: 500 });
  }
}
