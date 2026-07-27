import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

// GET /api/export-leads - Export all customer leads as a native Microsoft Excel file with RTL Arabic support and 100% separated columns
export async function GET() {
  try {
    await ensureTablesExist();
    const leads: any[] = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });

    let rowsHtml = "";

    leads.forEach((l: any) => {
      const name = (l.name || "عميل المركزية").trim();
      const contact = l.contact.trim();
      const code = l.promoCode.trim();
      const dateStr = new Date(l.createdAt).toLocaleString("ar-EG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      rowsHtml += `
        <tr>
          <td style="mso-number-format:'\\@'; padding: 6px; text-align: right;">${name}</td>
          <td style="mso-number-format:'\\@'; padding: 6px; text-align: center; color: #df8a27; font-weight: bold;">${contact}</td>
          <td style="mso-number-format:'\\@'; padding: 6px; text-align: center; background-color: #fef3c7;">${code}</td>
          <td style="mso-number-format:'\\@'; padding: 6px; text-align: center;">${dateStr}</td>
        </tr>`;
    });

    // Native Excel HTML Spreadsheet with Arabic RTL & Column Separation
    const excelDoc = `
<html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>قائمة العملاء</x:Name>
    <x:WorksheetOptions>
     <x:DisplayRightToLeft/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px; }
  th { background-color: #df8a27; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cccccc; }
  td { border: 1px solid #cccccc; }
</style>
</head>
<body dir="rtl">
  <table>
    <thead>
      <tr>
        <th style="width: 200px;">اسم العميل</th>
        <th style="width: 150px;">رقم الهاتف</th>
        <th style="width: 150px;">رمز الكوبون الممنوح</th>
        <th style="width: 220px;">تاريخ ووقت التسجيل</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="4" style="text-align:center; padding: 12px;">لا يوجد عملاء مسجلين بعد</td></tr>`}
    </tbody>
  </table>
</body>
</html>`;

    return new Response(excelDoc, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="almarkazia_leads_${new Date().toISOString().split("T")[0]}.xls"`,
      },
    });
  } catch (error) {
    console.error("Error exporting leads Excel:", error);
    return NextResponse.json({ error: "فشل تصدير البيانات" }, { status: 500 });
  }
}
