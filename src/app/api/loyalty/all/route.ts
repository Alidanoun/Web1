import { NextResponse } from "next/server";
import { getSql, ensureTablesExist } from "@/lib/db";

export async function GET() {
  try {
    await ensureTablesExist();
    const sql = getSql();
    const cards = await sql`SELECT * FROM "LoyaltyCard" ORDER BY "points" DESC, "totalEarned" DESC`;
    return NextResponse.json({ success: true, cards }, { status: 200 });
  } catch (err) {
    console.error("LoyaltyCard all fetch error:", err);
    return NextResponse.json({ success: true, cards: [] }, { status: 200 });
  }
}
