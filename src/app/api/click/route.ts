import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { product, platform } = await req.json();

    if (!product || !platform) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    try {
      await prisma.orderClick.create({
        data: {
          product: String(product),
          platform: String(platform),
        },
      });
    } catch (dbErr) {
      console.warn("Click save warning:", dbErr);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error logging click:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
