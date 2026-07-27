import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import { memoryScans, memoryRatings, memoryLeads, memoryClicks } from "@/lib/trackingStore";

export async function GET() {
  let dbScans: any[] = [];
  let dbRatings: any[] = [];
  let dbLeads: any[] = [];
  let dbClicks: any[] = [];

  try {
    await ensureTablesExist();
    dbScans = await prisma.scan.findMany().catch(() => []);
    dbRatings = await prisma.rating.findMany().catch(() => []);
    dbLeads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []);
    dbClicks = await prisma.orderClick.findMany().catch(() => []);
  } catch (error) {
    console.warn("DB stats fetch warning, combining with memory store:", error);
  }

  // Combine DB and Memory records safely (deduplicating by ID)
  const combinedScans = [...memoryScans];
  dbScans.forEach((s) => {
    if (!combinedScans.some((m) => m.id === s.id)) {
      combinedScans.push({ id: s.id, product: s.product, createdAt: s.createdAt?.toISOString?.() || String(s.createdAt) });
    }
  });

  const combinedRatings = [...memoryRatings];
  dbRatings.forEach((r) => {
    if (!combinedRatings.some((m) => m.id === r.id)) {
      combinedRatings.push({ id: r.id, product: r.product, stars: r.stars, comment: r.comment, createdAt: r.createdAt?.toISOString?.() || String(r.createdAt) });
    }
  });

  const combinedLeads = [...memoryLeads];
  dbLeads.forEach((l) => {
    if (!combinedLeads.some((m) => m.id === l.id)) {
      combinedLeads.push({ id: l.id, name: l.name, contact: l.contact, promoCode: l.promoCode, createdAt: l.createdAt?.toISOString?.() || String(l.createdAt) });
    }
  });

  const combinedClicks = [...memoryClicks];
  dbClicks.forEach((c) => {
    if (!combinedClicks.some((m) => m.id === c.id)) {
      combinedClicks.push({ id: c.id, product: c.product, platform: c.platform, createdAt: c.createdAt?.toISOString?.() || String(c.createdAt) });
    }
  });

  // Calculate scans count per product
  const scans: Record<string, number> = {};
  combinedScans.forEach((curr) => {
    const p = curr.product.toLowerCase();
    scans[p] = (scans[p] || 0) + 1;
  });

  // Calculate ratings ratingAgg
  const ratingAgg: Record<string, { total: number; count: number }> = {};
  combinedRatings.forEach((curr) => {
    const p = curr.product.toLowerCase();
    if (!ratingAgg[p]) ratingAgg[p] = { total: 0, count: 0 };
    ratingAgg[p].total += curr.stars;
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

  // Calculate clicks count per platform
  const clicks: Record<string, number> = {};
  combinedClicks.forEach((curr) => {
    const pl = curr.platform.toLowerCase();
    clicks[pl] = (clicks[pl] || 0) + 1;
  });

  return NextResponse.json(
    {
      success: true,
      scans,
      ratings,
      leads: {
        total: combinedLeads.length,
        recent: combinedLeads.slice(0, 20),
      },
      clicks,
      recentScans: combinedScans.slice(0, 20),
      recentRatings: combinedRatings.slice(0, 20),
    },
    { status: 200 }
  );
}
