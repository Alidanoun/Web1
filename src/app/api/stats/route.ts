import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

export async function GET() {
  try {
    await ensureTablesExist();

    const allScans = await prisma.scan.findMany({ select: { product: true } });
    const scans = allScans.reduce((acc: Record<string, number>, curr) => {
      const p = curr.product.toLowerCase();
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

    const totalLeads = await prisma.lead.count();
    const recentLeads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    const allClicks = await prisma.orderClick.findMany({ select: { platform: true } });
    const clicks = allClicks.reduce((acc: Record<string, number>, curr) => {
      const pl = curr.platform.toLowerCase();
      acc[pl] = (acc[pl] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentScans = await prisma.scan.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

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
    const msg = error instanceof Error ? error.message : "فشل جلب الإحصائيات";
    return NextResponse.json(
      {
        success: false,
        error: `خطأ بالداتا بيس: ${msg}`,
        scans: {},
        ratings: {},
        leads: { total: 0, recent: [] },
        clicks: {},
        recentScans: [],
        recentRatings: [],
      },
      { status: 500 }
    );
  }
}
