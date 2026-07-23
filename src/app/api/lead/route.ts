import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";
import crypto from "crypto";

// Helper to generate custom alphanumeric suffix like '12yj5h', '456bgth'
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

    // Generate custom code formatted like: MARKZIA-12yj5h, MARKZIA-456bgth
    const suffix = generateAlphanumericSuffix(6);
    const promoCode = `MARKZIA-${suffix}`;

    try {
      // Check if lead already exists by contact number to return existing code
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
    } catch (dbErr) {
      console.warn("Prisma lead save warning:", dbErr);
    }

    return NextResponse.json({ success: true, promoCode }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}
