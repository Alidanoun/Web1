import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

// Cache products at the Cloudflare edge for 5 minutes,
// serve stale while revalidating in the background.
const CACHE_SECONDS = 300;

// GET /api/products — fetch all products
export async function GET() {
  try {
    await ensureTablesExist();
    const products = await prisma.product.findMany();
    return NextResponse.json(
      { success: true, products },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (err) {
    console.error("Products GET error:", err);
    return NextResponse.json({ success: false, products: [], error: String(err) });
  }
}

// POST /api/products — upsert a product (protected by middleware)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await ensureTablesExist();
    const result = await prisma.product.upsert({
      where: { id: body.id },
      update: body,
      create: body,
    });
    return NextResponse.json({ success: true, product: result });
  } catch (err) {
    console.error("Products POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
