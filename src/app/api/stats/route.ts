import { NextResponse } from "next/server";
import { prisma, ensureTablesExist, formatDbError, runQuery, fallbackStore } from "@/lib/db";

export async function GET() {
  let dbConnected = false;
  let dbScans: any[] = [];
  let dbRatings: any[] = [];
  let dbLeads: any[] = [];
  let dbClicks: any[] = [];
  let dbError = "";

  try {
    // 1. Verify actual live DB connectivity with simple ping query
    await runQuery("SELECT 1");
    await ensureTablesExist();
    dbScans   = await prisma.scan.findMany();
    dbRatings = await prisma.rating.findMany();
    dbLeads   = await prisma.lead.findMany();
    dbClicks  = await prisma.orderClick.findMany();
    dbConnected = true;
  } catch (error) {
    dbError = formatDbError(error);
    console.error("Stats DB notice:", dbError);
    // Instant fallback from memory store
    dbScans   = fallbackStore.scans;
    dbRatings = fallbackStore.ratings;
    dbLeads   = fallbackStore.leads;
    dbClicks  = fallbackStore.orderClicks;
  }

  // Scans per product
  const scans: Record<string, number> = {};
  dbScans.forEach((s) => {
    const p = s.product.toLowerCase();
    scans[p] = (scans[p] || 0) + 1;
  });

  // Ratings aggregation
  const ratingAgg: Record<string, { total: number; count: number }> = {};
  dbRatings.forEach((r) => {
    const p = r.product.toLowerCase();
    if (!ratingAgg[p]) ratingAgg[p] = { total: 0, count: 0 };
    ratingAgg[p].total += r.stars;
    ratingAgg[p].count += 1;
  });

  const ratings: Record<string, { count: number; avg: number }> = {};
  Object.keys(ratingAgg).forEach((p) => {
    const info = ratingAgg[p];
    ratings[p] = {
      count: info.count,
      avg: info.count > 0 ? Number((info.total / info.count).toFixed(1)) : 0,
    };
  });

  // Clicks per platform
  const clicks: Record<string, number> = {};
  dbClicks.forEach((c) => {
    const pl = c.platform.toLowerCase();
    clicks[pl] = (clicks[pl] || 0) + 1;
  });

  return NextResponse.json(
    {
      success: true,
      dbConnected,
      dbError: dbError || null,
      scans,
      ratings,
      leads: {
        total: dbLeads.length,
        recent: dbLeads.slice(0, 20),
      },
      clicks,
      recentScans: dbScans.slice(0, 20).map((s) => ({
        id: s.id,
        product: s.product,
        createdAt: s.createdAt?.toISOString?.() || String(s.createdAt),
      })),
      recentRatings: dbRatings.slice(0, 20).map((r) => ({
        id: r.id,
        product: r.product,
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt?.toISOString?.() || String(r.createdAt),
      })),
    },
    { status: 200 }
  );
}
