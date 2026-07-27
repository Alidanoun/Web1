import { NextResponse } from "next/server";
import { getSql, ensureTablesExist } from "@/lib/db";

// POST /api/reset - Clears all test scans, ratings, leads, and clicks
export async function POST() {
  try {
    await ensureTablesExist();
    const sql = getSql();
    await sql`DELETE FROM "Scan"`;
    await sql`DELETE FROM "Rating"`;
    await sql`DELETE FROM "Lead"`;
    await sql`DELETE FROM "OrderClick"`;

    return NextResponse.json({
      success: true,
      message: "تم تصفير وإعادة ضبط قاعدة البيانات بنجاح! أصبح النظام جاهزاً الآن لتلقي بيانات العملاء الحقيقية.",
    }, { status: 200 });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json({ error: "فشل تصفير قاعدة البيانات" }, { status: 500 });
  }
}
