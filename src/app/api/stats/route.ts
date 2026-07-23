import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

export async function GET() {
  try {
    await ensureTablesExist();

    // 1. Get total scans count grouped by product
    const allScans = await prisma.scan.findMany({ select: { product: true } });
    const scans = allScans.reduce((acc: Record<string, number>, curr) => {
      const p = curr.product.toLowerCase();
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 2. Get ratings count & average grouped by product
    const allRatings = await prisma.rating.findMany({ select: { product: true, stars: true } });
    const ratingAgg = allRatings.reduce((acc: Record<string, { total: number; count: number }>, curr) => {
      const p = curr.product.toLowerCase();
      if (!acc[p]) acc[p] = { total: 0, count: 0 };
      acc[p].total += curr.stars;
      acc[p].count += 1;
      return acc;
    }, {});

    const ratings: Record<string, { count: number; avg: number }> = {};
    Object.keys(ratingAgg).forEach((p) => {
      const info = ratingAgg[p];
      ratings[p] = {
        count: info.count,
        avg: info.count > 0 ? Number((info.total / info.count).toFixed(1)) : 0,
      };
    });

    // 3. Get total leads & recent lead records
    const totalLeads = await prisma.lead.count();
    const recentLeads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    // 4. Get order clicks grouped by platform
    const allClicks = await prisma.orderClick.findMany({ select: { platform: true } });
    const clicks = allClicks.reduce((acc: Record<string, number>, curr) => {
      const pl = curr.platform.toLowerCase();
      acc[pl] = (acc[pl] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 5. Get recent scan events
    const recentScans = await prisma.scan.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // 6. Get recent ratings with feedback comments
    const recentRatings = await prisma.rating.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    return NextResponse.json(
      {
        success: true,
        scans,
        ratings,
        leads: {
          total: totalLeads,
          recent: recentLeads,
        },
        clicks,
        recentScans,
        recentRatings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error gathering stats:", error);
    return NextResponse.json(
      {
        success: true,
        scans: {},
        ratings: {},
        leads: { total: 0, recent: [] },
        clicks: {},
        recentScans: [],
        recentRatings: [],
      },
      { status: 200 }
    );
  }
}
