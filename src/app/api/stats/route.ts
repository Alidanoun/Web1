import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 1. Get total scans count grouped by product
    const scansGroup = await prisma.scan.groupBy({
      by: ["product"],
      _count: {
        _all: true,
      },
    });

    const scans = scansGroup.reduce((acc, curr) => {
      acc[curr.product] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    // 2. Get ratings count & average grouped by product
    const ratingsGroup = await prisma.rating.groupBy({
      by: ["product"],
      _count: {
        stars: true,
      },
      _avg: {
        stars: true,
      },
    });

    const ratings = ratingsGroup.reduce((acc, curr) => {
      acc[curr.product] = {
        count: curr._count.stars,
        avg: curr._avg.stars ? Number(curr._avg.stars.toFixed(1)) : 0,
      };
      return acc;
    }, {} as Record<string, { count: number; avg: number }>);

    // 3. Get total leads & recent lead records
    const totalLeads = await prisma.lead.count();
    const recentLeads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    // 4. Get order clicks grouped by platform
    const clicksGroup = await prisma.orderClick.groupBy({
      by: ["platform"],
      _count: {
        _all: true,
      },
    });

    const clicks = clicksGroup.reduce((acc, curr) => {
      acc[curr.platform] = curr._count._all;
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
    return NextResponse.json({ error: "فشل تحميل الإحصائيات" }, { status: 500 });
  }
}
