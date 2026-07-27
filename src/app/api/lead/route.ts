import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

function generateAlphanumericSuffix(length = 6): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const { name, contact } = await req.json();

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "الرجاء إدخال الاسم الكريم" }, { status: 400 });
    }
    if (!contact || typeof contact !== "string" || contact.trim() === "") {
      return NextResponse.json({ error: "الرجاء إدخال رقم الهاتف الصالح" }, { status: 400 });
    }

    const customerName = name.trim();
    const phoneContact = contact.trim();
    const cleanPhone = phoneContact.replace(/[^0-9+]/g, "");

    if (cleanPhone.length < 8) {
      return NextResponse.json({ error: "الرجاء إدخال رقم هاتف صحيح يحتوي على 8 أرقام على الأقل" }, { status: 400 });
    }

    await ensureTablesExist();

    // Check if this phone already has a promo code
    const existingLead = await prisma.lead.findFirst({ where: { contact: phoneContact } });
    if (existingLead) {
      return NextResponse.json(
        {
          success: true,
          promoCode: existingLead.promoCode,
          message: `أهلاً بك مجدداً ${existingLead.name || customerName}! تفضل كوبون الخصم الخاص بك:`,
        },
        { status: 200 }
      );
    }

    const promoCode = `MARKZIA-${generateAlphanumericSuffix(6).toUpperCase()}`;
    const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await prisma.lead.create({
      data: { id, name: customerName, contact: phoneContact, promoCode },
    });

    return NextResponse.json({ success: true, promoCode }, { status: 201 });
  } catch (error) {
    console.error("Lead DB error:", error instanceof Error ? error.message : error);
    // Fallback: generate a code even if DB fails so customer doesn't see error
    const fallbackCode = `MARKZIA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return NextResponse.json({ success: true, promoCode: fallbackCode }, { status: 200 });
  }
}
