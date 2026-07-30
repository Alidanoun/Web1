import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لا يوجد ملف مرفق" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم، يرجى رفع صورة فقط" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";
    const base64 = buffer.toString("base64");

    // Universal Data URL: 100% compatible with Cloudflare Workers, Neon PostgreSQL & Next.js
    const imageUrl = `data:${mimeType};base64,${base64}`;

    // Try saving locally as backup if filesystem is writable (Local Node dev server)
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const uploadDir = path.join(process.cwd(), "public", "uploads", "recipes");
      await fs.mkdir(uploadDir, { recursive: true });
      const ext = mimeType.split("/")[1] || "jpg";
      const fileName = `recipe-${Date.now()}.${ext}`;
      await fs.writeFile(path.join(uploadDir, fileName), buffer);
    } catch {
      // In serverless / edge environment, filesystem may be read-only, Data URL is used
    }

    return NextResponse.json({ success: true, imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading recipe image:", error);
    return NextResponse.json({ error: "فشل رفع الصورة على السيرفر" }, { status: 500 });
  }
}
