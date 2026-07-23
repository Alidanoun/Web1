import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import crypto from "crypto";

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
    await ensureTablesExist();

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

    const suffix = generateAlphanumericSuffix(6);
    const promoCode = `MARKZIA-${suffix}`;

    try {
      const existingLead = await prisma.lead.findFirst({
        where: { contact: phoneContact },
      });

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

      await prisma.lead.create({
        data: {
          id: crypto.randomUUID(),
          name: customerName,
          contact: phoneContact,
          promoCode,
        },
      });

      return NextResponse.json({ success: true, promoCode }, { status: 201 });
    } catch (dbErr) {
      console.error("Prisma lead save error:", dbErr);
      return NextResponse.json(
        { success: false, error: `فشل حفظ بيانات العميل بالداتا بيس: ${(dbErr as Error).message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
