import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import { recordMemoryRating } from "@/lib/trackingStore";

export async function POST(req: Request) {
  try {
    await ensureTablesExist();

    const { product, stars, comment } = await req.json();

    if (!product || typeof stars !== "number" || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const memoryRating = recordMemoryRating(String(product), Number(stars), comment ? String(comment) : "");

    try {
      await prisma.rating.create({
        data: {
          id: memoryRating.id,
          product: String(product),
          stars: Number(stars),
          comment: comment ? String(comment) : "",
        },
      });
    } catch (dbErr) {
      console.warn("Rating save warning:", dbErr);
    }

    return NextResponse.json({ success: true, rating: memoryRating }, { status: 201 });
  } catch (error) {
    console.error("Error creating rating:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
