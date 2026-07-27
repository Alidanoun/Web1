import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import crypto from "crypto";

// In-memory fallback (إذا قاعدة البيانات غير متاحة مؤقتاً)
const globalStore = globalThis as any;
if (!globalStore.__loyaltyCards) globalStore.__loyaltyCards = new Map<string, any>();
const memoryCards: Map<string, any> = globalStore.__loyaltyCards;

function generateRewardCode(phone: string): string {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const last4 = phone.replace(/\D/g, "").slice(-4);
  return `LOYALTY-${last4}-${suffix}`;
}

// ────────────────────────────────────────────────
// GET /api/loyalty?phone=0501234567
// Returns current card info for a given phone number
// ────────────────────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone")?.trim();

  if (!phone || phone.length < 8) {
    return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
  }

  try {
    await ensureTablesExist();

    const card = await prisma.loyaltyCard.findUnique({ where: { phone } });

    if (card) {
      return NextResponse.json({ success: true, card });
    }

    // Fallback to memory
    const memCard = memoryCards.get(phone);
    if (memCard) {
      return NextResponse.json({ success: true, card: memCard });
    }

    // New customer — return empty card
    return NextResponse.json({
      success: true,
      card: { phone, name: "", points: 0, totalEarned: 0, rewardCode: "", rewardUsed: false },
    });
  } catch (err) {
    const memCard = memoryCards.get(phone);
    return NextResponse.json({
      success: true,
      card: memCard ?? { phone, name: "", points: 0, totalEarned: 0, rewardCode: "", rewardUsed: false },
    });
  }
}

// ────────────────────────────────────────────────
// POST /api/loyalty
// Body: { phone, name, action: "scan" | "redeem" | "reset" }
// ────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { phone, name, action } = await req.json();

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanName = name ? String(name).trim() : "";
    await ensureTablesExist();

    // ── Action: scan ────────────────────────────
    if (action === "scan") {
      const COOLDOWN_HOURS = 12; // 12 ساعة بين كل مسح ومسح
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      const now = new Date();

      let existingCard: any = null;
      try {
        existingCard = await prisma.loyaltyCard.findUnique({ where: { phone: cleanPhone } });
      } catch (_) {}

      // Fallback to memory if DB failed
      if (!existingCard) existingCard = memoryCards.get(cleanPhone) ?? null;

      // Cooldown check
      if (existingCard?.lastScanAt) {
        const lastScan = new Date(existingCard.lastScanAt).getTime();
        const diff = now.getTime() - lastScan;
        if (diff < cooldownMs) {
          const remainingHours = Math.ceil((cooldownMs - diff) / 3600000);
          return NextResponse.json({
            success: false,
            status: "cooldown",
            remainingHours,
            card: existingCard,
            message: `نقطتك مسجلة! يمكنك المسح مجدداً بعد ${remainingHours} ساعة.`,
          });
        }
      }

      // Already maxed out check
      if (existingCard && existingCard.points >= 10 && !existingCard.rewardUsed) {
        return NextResponse.json({
          success: true,
          status: "max",
          card: existingCard,
          message: "لقد جمعت 10 نقاط! استخدم كود الخصم الخاص بك.",
        });
      }

      // Calculate new points
      const currentPoints = existingCard?.points ?? 0;
      const newPoints = Math.min(currentPoints + 1, 10);
      const totalEarned = (existingCard?.totalEarned ?? 0) + 1;
      let rewardCode = existingCard?.rewardCode ?? "";

      // Generate unique reward code when reaching 10 points
      if (newPoints >= 10 && !rewardCode) {
        rewardCode = generateRewardCode(cleanPhone);
      }

      const updatedCard = {
        id: existingCard?.id ?? crypto.randomUUID(),
        phone: cleanPhone,
        name: cleanName || existingCard?.name || "",
        points: newPoints,
        totalEarned,
        rewardCode,
        rewardUsed: existingCard?.rewardUsed ?? false,
        lastScanAt: now.toISOString(),
        createdAt: existingCard?.createdAt ?? now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // Save to memory immediately
      memoryCards.set(cleanPhone, updatedCard);

      // Try to save to DB
      try {
        if (existingCard && existingCard.id) {
          await prisma.$executeRawUnsafe(
            `UPDATE "LoyaltyCard" SET "name"=$1, "points"=$2, "totalEarned"=$3, "rewardCode"=$4, "lastScanAt"=$5, "updatedAt"=$6 WHERE "phone"=$7`,
            updatedCard.name,
            newPoints,
            totalEarned,
            rewardCode,
            now,
            now,
            cleanPhone
          );
        } else {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "LoyaltyCard" ("id","phone","name","points","totalEarned","rewardCode","rewardUsed","lastScanAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
            updatedCard.id,
            cleanPhone,
            updatedCard.name,
            newPoints,
            totalEarned,
            rewardCode,
            false,
            now,
            now
          );
        }
      } catch (dbErr) {
        console.warn("LoyaltyCard DB save warning (using memory):", dbErr);
      }

      const status = newPoints >= 10 ? "max" : "success";
      return NextResponse.json({ success: true, status, card: updatedCard }, { status: 201 });
    }

    // ── Action: redeem (استخدام الخصم وتصفير البطاقة) ──
    if (action === "redeem") {
      const now = new Date();
      let card: any = null;
      try {
        card = await prisma.loyaltyCard.findUnique({ where: { phone: cleanPhone } });
      } catch (_) {}
      if (!card) card = memoryCards.get(cleanPhone);

      if (!card || card.points < 10) {
        return NextResponse.json({ error: "لا تملك نقاطاً كافية للاسترداد" }, { status: 400 });
      }

      const updatedCard = {
        ...card,
        points: 0,
        rewardCode: "",
        rewardUsed: true,
        updatedAt: now.toISOString(),
      };

      memoryCards.set(cleanPhone, updatedCard);

      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "LoyaltyCard" SET "points"=0, "rewardCode"='', "rewardUsed"=true, "updatedAt"=$1 WHERE "phone"=$2`,
          now,
          cleanPhone
        );
      } catch (dbErr) {
        console.warn("LoyaltyCard redeem DB warning:", dbErr);
      }

      return NextResponse.json({ success: true, status: "redeemed", card: updatedCard });
    }

    return NextResponse.json({ error: "action غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Loyalty POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// ────────────────────────────────────────────────
// GET /api/loyalty/all — for admin dashboard
// ────────────────────────────────────────────────
