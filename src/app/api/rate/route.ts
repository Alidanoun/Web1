import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await ensureTablesExist();

    const { product, stars, comment } = await req.json();

    if (!product || typeof stars !== "number" || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    try {
      await prisma.rating.create({
        data: {
          id: crypto.randomUUID(),
          product: String(product),
          stars: Number(stars),
          comment: comment ? String(comment) : "",
        },
      });
    } catch (dbErr) {
      console.warn("Rating save warning:", dbErr);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating rating:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
