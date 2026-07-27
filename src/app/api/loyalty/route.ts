import { NextResponse } from "next/server";
import { getSql, ensureTablesExist } from "@/lib/db";
import crypto from "crypto";

function generateRewardCode(phone: string): string {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const last4 = phone.replace(/\D/g, "").slice(-4);
  return `LOYALTY-${last4}-${suffix}`;
}

// GET /api/loyalty?phone=0501234567
export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone")?.trim();

  if (!phone || phone.length < 8) {
    return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
  }

  try {
    await ensureTablesExist();
    const sql = getSql();
    const rows = await sql`SELECT * FROM "LoyaltyCard" WHERE "phone"=${phone} LIMIT 1`;
    const card = rows[0] ?? { phone, name: "", points: 0, totalEarned: 0, rewardCode: "", rewardUsed: false };
    return NextResponse.json({ success: true, card });
  } catch (err) {
    return NextResponse.json({ success: true, card: { phone, name: "", points: 0, totalEarned: 0, rewardCode: "", rewardUsed: false } });
  }
}

// POST /api/loyalty — action: "scan" | "redeem"
export async function POST(req: Request) {
  try {
    const { phone, name, action } = await req.json();

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanName = name ? String(name).trim() : "";
    await ensureTablesExist();
    const sql = getSql();

    // ── Action: scan ──────────────────────────────────────────────────────
    if (action === "scan") {
      const COOLDOWN_HOURS = 12;
      const now = new Date();

      const rows = await sql`SELECT * FROM "LoyaltyCard" WHERE "phone"=${cleanPhone} LIMIT 1`;
      const existing = rows[0] ?? null;

      // Cooldown check
      if (existing?.lastScanAt) {
        const lastScan = new Date(existing.lastScanAt).getTime();
        const diffMs = now.getTime() - lastScan;
        const cooldownMs = COOLDOWN_HOURS * 3600 * 1000;
        if (diffMs < cooldownMs) {
          const remainingHours = Math.ceil((cooldownMs - diffMs) / 3600000);
          return NextResponse.json({ success: false, status: "cooldown", remainingHours, card: existing, message: `نقطتك مسجلة! يمكنك المسح مجدداً بعد ${remainingHours} ساعة.` });
        }
      }

      // Already at 10 points and not redeemed
      if (existing && existing.points >= 10 && !existing.rewardUsed) {
        return NextResponse.json({ success: true, status: "max", card: existing, message: "لقد جمعت 10 نقاط! استخدم كود الخصم." });
      }

      const currentPoints = existing?.points ?? 0;
      const newPoints = Math.min(currentPoints + 1, 10);
      const totalEarned = (existing?.totalEarned ?? 0) + 1;
      let rewardCode = existing?.rewardCode ?? "";
      if (newPoints >= 10 && !rewardCode) {
        rewardCode = generateRewardCode(cleanPhone);
      }

      const cardName = cleanName || existing?.name || "";

      if (existing) {
        await sql`
          UPDATE "LoyaltyCard"
          SET "name"=${cardName}, "points"=${newPoints}, "totalEarned"=${totalEarned},
              "rewardCode"=${rewardCode}, "lastScanAt"=${now}, "updatedAt"=${now}
          WHERE "phone"=${cleanPhone}`;
      } else {
        const id = crypto.randomUUID();
        await sql`
          INSERT INTO "LoyaltyCard" ("id","phone","name","points","totalEarned","rewardCode","rewardUsed","lastScanAt","createdAt","updatedAt")
          VALUES (${id},${cleanPhone},${cardName},${newPoints},${totalEarned},${rewardCode},false,${now},${now},${now})`;
      }

      const updatedRows = await sql`SELECT * FROM "LoyaltyCard" WHERE "phone"=${cleanPhone} LIMIT 1`;
      const updatedCard = updatedRows[0];

      const status = newPoints >= 10 ? "max" : "success";
      return NextResponse.json({ success: true, status, card: updatedCard }, { status: 201 });
    }

    // ── Action: redeem ────────────────────────────────────────────────────
    if (action === "redeem") {
      const rows = await sql`SELECT * FROM "LoyaltyCard" WHERE "phone"=${cleanPhone} LIMIT 1`;
      const card = rows[0];
      if (!card || card.points < 10) {
        return NextResponse.json({ error: "لا تملك نقاطاً كافية للاسترداد" }, { status: 400 });
      }
      const now = new Date();
      await sql`UPDATE "LoyaltyCard" SET "points"=0,"rewardCode"='',"rewardUsed"=true,"updatedAt"=${now} WHERE "phone"=${cleanPhone}`;
      const updated = await sql`SELECT * FROM "LoyaltyCard" WHERE "phone"=${cleanPhone} LIMIT 1`;
      return NextResponse.json({ success: true, status: "redeemed", card: updated[0] });
    }

    return NextResponse.json({ error: "action غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Loyalty POST error:", error);
    return NextResponse.json({ error: "حدث خطأ: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
