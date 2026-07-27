import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

const globalStore = globalThis as any;
if (!globalStore.__loyaltyCards) globalStore.__loyaltyCards = new Map<string, any>();
const memoryCards: Map<string, any> = globalStore.__loyaltyCards;

// GET /api/loyalty/all — returns all loyalty cards for admin
export async function GET() {
  let cards: any[] = [];

  try {
    await ensureTablesExist();
    const dbCards = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "LoyaltyCard" ORDER BY "points" DESC, "totalEarned" DESC`
    );
    cards = dbCards;
  } catch (err) {
    console.warn("LoyaltyCard DB read warning:", err);
  }

  // Merge memory cards (add any not in DB)
  const dbPhones = new Set(cards.map((c: any) => c.phone));
  memoryCards.forEach((card) => {
    if (!dbPhones.has(card.phone)) {
      cards.push(card);
    }
  });

  // Sort: highest points first
  cards.sort((a, b) => b.points - a.points || b.totalEarned - a.totalEarned);

  return NextResponse.json({ success: true, cards }, { status: 200 });
}
