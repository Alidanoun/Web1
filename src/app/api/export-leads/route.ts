import { NextResponse } from "next/server";
import { prisma, ensureTablesExist } from "@/lib/db";

// Helper function to format date nicely in Arabic
function formatArabicDate(date: Date | string | number): string {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return String(date);
  }
}

export async function GET(req: Request) {
  try {
    await ensureTablesExist();

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "summary"; // 'leads' | 'scans' | 'loyalty' | 'summary'
    const startDateParam = searchParams.get("startDate"); // YYYY-MM-DD
    const endDateParam = searchParams.get("endDate"); // YYYY-MM-DD

    let dateRangeText = "كافة الأوقات";
    if (startDateParam || endDateParam) {
      dateRangeText = startDateParam === endDateParam
        ? `بتاريخ: ${startDateParam}`
        : `من ${startDateParam || "البداية"} إلى ${endDateParam || "اليوم"}`;
    }

    // In-memory date filter helper to guarantee timezone resilience
    const isWithinRange = (dateInput: any) => {
      if (!startDateParam && !endDateParam) return true;
      if (!dateInput) return true;
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return true;
      const start = startDateParam ? new Date(`${startDateParam}T00:00:00.000`) : new Date("2020-01-01");
      const end = endDateParam ? new Date(`${endDateParam}T23:59:59.999`) : new Date("2099-12-31");
      return d >= start && d <= end;
    };

    // 1. Fetch All Tables Safely
    const rawLeads: any[] = (await prisma.lead.findMany()) || [];
    const rawScans: any[] = (await prisma.scan.findMany()) || [];
    const rawRatings: any[] = (await prisma.rating.findMany()) || [];
    const rawOrderClicks: any[] = (await prisma.orderClick.findMany()) || [];
    const rawLoyaltyCards: any[] = (await prisma.loyaltyCard.findMany()) || [];

    // Filter by date
    const leads = rawLeads.filter((l) => isWithinRange(l.createdAt));
    const scans = rawScans.filter((s) => isWithinRange(s.createdAt));
    const ratings = rawRatings.filter((r) => isWithinRange(r.createdAt));
    const orderClicks = rawOrderClicks.filter((o) => isWithinRange(o.createdAt));
    const loyaltyCards = rawLoyaltyCards; // Loyalty cards represent current state

    // Calculate Scans Breakdown
    const scansCountMap: Record<string, number> = {};
    scans.forEach((s: any) => {
      const prod = s.product || "home";
      scansCountMap[prod] = (scansCountMap[prod] || 0) + 1;
    });

    // Product Names Mapping
    const productLabels: Record<string, string> = {
      home: "🏠 الرمز العام (الصفحة الرئيسية)",
      loyalty: "🦁 رمز جمع نقاط الولاء (الملحمة)",
      "katef-kharouf": "🐑 كتف خاروف بلدي",
      "lahma-mafrouma-khashna": "🥩 لحمه مفرومه خشنه طازجه",
      "lahma-mafrouma-naema": "🥩 لحمه مفرومه ناعمه طازجه",
      "lahma-mafrouma-ejel": "🥩 لحمه مفرومه عجل مع خاروف بلدي",
      "ras-asfour": "🍖 راس عصفور عجل طازج",
      ribs: "🍖 ريش خارووف طازج",
      burger: "🍔 برغر لحم طازج",
      chinese: "🥘 تشاينيز عجل طازج",
      "ribeye-steak": "🥩 رب اي ستيك",
      kofta: "🥘 كفته لحم عجل مع خروف",
      "filet-steak": "🥩 ستيك فيليه طازج",
      liyeh: "🐑 ليه خاروف بلدي",
      sausage: "🌭 سجق لحم بقري بلدي",
      "fakheth-kharouf": "🐑 فخذ خاروف بلدي",
      adla3: "🍖 اضلاع خاروف بلدي",
    };

    let filename = `almarkazia_report_${new Date().toISOString().split("T")[0]}.xls`;
    let tableHtml = "";

    // BUILD SPECIFIC REPORT
    if (reportType === "leads") {
      filename = `almarkazia_leads_${startDateParam || "all"}.xls`;
      tableHtml = `
        <h2 style="color: #df8a27; font-family: Arial;">🎁 تقرير العملاء وكوبونات الخصم (${dateRangeText})</h2>
        <p>إجمالي العملاء المسجلين في هذه الفترة: <strong>${leads.length}</strong> عميل</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Arial; font-size: 13px;">
          <thead>
            <tr style="background-color: #df8a27; color: #ffffff; font-weight: bold;">
              <th style="width: 60px;">#</th>
              <th style="width: 200px;">اسم العميل</th>
              <th style="width: 160px;">رقم الهاتف</th>
              <th style="width: 180px;">رمز الكوبون الممنوح</th>
              <th style="width: 220px;">تاريخ ووقت التسجيل</th>
            </tr>
          </thead>
          <tbody>
            ${
              leads.length > 0
                ? leads
                    .map(
                      (l: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: right; font-weight: bold;">${l.name || "عميل المركزية"}</td>
                <td style="mso-number-format:'\\@'; text-align: center; color: #df8a27; font-weight: bold;">${l.contact}</td>
                <td style="mso-number-format:'\\@'; text-align: center; background-color: #fef3c7; font-weight: bold;">${l.promoCode}</td>
                <td style="text-align: center;">${formatArabicDate(l.createdAt)}</td>
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="5" style="text-align: center; padding: 15px;">لا توجد بيانات مسجلة في هذه الفترة</td></tr>`
            }
          </tbody>
        </table>`;
    } else if (reportType === "scans") {
      filename = `almarkazia_scans_${startDateParam || "all"}.xls`;
      const sortedScans = Object.entries(scansCountMap).sort((a, b) => b[1] - a[1]);

      tableHtml = `
        <h2 style="color: #df8a27; font-family: Arial;">📊 تقرير مسحات الـ QR والزيارات (${dateRangeText})</h2>
        <p>إجمالي الزيارات والمسحات في هذه الفترة: <strong>${scans.length}</strong> زيارة</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Arial; font-size: 13px;">
          <thead>
            <tr style="background-color: #df8a27; color: #ffffff; font-weight: bold;">
              <th style="width: 60px;">#</th>
              <th style="width: 250px;">الصنف / الصفحة</th>
              <th style="width: 140px;">معرف الصنف (ID)</th>
              <th style="width: 150px;">عدد مرات المسح والزيارة</th>
              <th style="width: 120px;">النسبة المئوية</th>
            </tr>
          </thead>
          <tbody>
            ${
              sortedScans.length > 0
                ? sortedScans
                    .map(([key, count], idx) => {
                      const pct = scans.length > 0 ? ((count / scans.length) * 100).toFixed(1) : "0";
                      return `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: right; font-weight: bold;">${productLabels[key] || key}</td>
                <td style="text-align: center; color: #666;">${key}</td>
                <td style="text-align: center; font-weight: bold; color: #df8a27;">${count}</td>
                <td style="text-align: center;">${pct}%</td>
              </tr>`;
                    })
                    .join("")
                : `<tr><td colspan="5" style="text-align: center; padding: 15px;">لا توجد مسحات مسجلة في هذه الفترة</td></tr>`
            }
          </tbody>
        </table>`;
    } else if (reportType === "loyalty") {
      filename = `almarkazia_loyalty_${new Date().toISOString().split("T")[0]}.xls`;
      tableHtml = `
        <h2 style="color: #df8a27; font-family: Arial;">🦁 تقرير بطاقات ونقاط الولاء للعملاء</h2>
        <p>إجمالي البطاقات المسجلة: <strong>${loyaltyCards.length}</strong> بطاقة</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Arial; font-size: 13px;">
          <thead>
            <tr style="background-color: #df8a27; color: #ffffff; font-weight: bold;">
              <th style="width: 50px;">#</th>
              <th style="width: 180px;">اسم العميل</th>
              <th style="width: 150px;">رقم الهاتف</th>
              <th style="width: 120px;">النقاط المجمعة</th>
              <th style="width: 150px;">حالة المكافأة</th>
              <th style="width: 160px;">كود المكافأة</th>
              <th style="width: 200px;">تاريخ آخر مسح</th>
            </tr>
          </thead>
          <tbody>
            ${
              loyaltyCards.length > 0
                ? loyaltyCards
                    .map(
                      (c: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: right; font-weight: bold;">${c.name || "عميل مميز"}</td>
                <td style="mso-number-format:'\\@'; text-align: center; color: #df8a27; font-weight: bold;">${c.phone}</td>
                <td style="text-align: center; font-weight: bold; font-size: 14px;">${c.points || 0} / 10</td>
                <td style="text-align: center; background-color: ${c.points >= 10 ? "#d1fae5" : "#f3f4f6"}; color: ${c.points >= 10 ? "#065f46" : "#4b5563"}; font-weight: bold;">
                  ${c.points >= 10 ? "🏆 جاهز للمكافأة" : "قيد التجميع"}
                </td>
                <td style="mso-number-format:'\\@'; text-align: center; background-color: #fef3c7;">${c.rewardCode || "-"}</td>
                <td style="text-align: center;">${formatArabicDate(c.lastScanDate || c.updatedAt)}</td>
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="7" style="text-align: center; padding: 15px;">لا توجد بطاقات ولاء بعد</td></tr>`
            }
          </tbody>
        </table>`;
    } else {
      // SUMMARY REPORT (All metrics)
      filename = `almarkazia_daily_summary_${startDateParam || "all"}.xls`;
      const conversionRate = scans.length > 0 ? ((orderClicks.length / scans.length) * 100).toFixed(1) : "0";
      const sortedScans = Object.entries(scansCountMap).sort((a, b) => b[1] - a[1]);

      tableHtml = `
        <h1 style="color: #df8a27; font-family: Arial; margin-bottom: 5px;">تقرير الإدارة والملخص التنفيذي — ملاحم المركزية</h1>
        <p style="font-size: 14px; color: #555;">الفترة المحددة: <strong>${dateRangeText}</strong> | تاريخ التصدير: ${formatArabicDate(new Date())}</p>
        
        <!-- Summary Cards Table -->
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: Arial; font-size: 14px; margin-bottom: 20px; background-color: #fdfbf7;">
          <tr style="background-color: #df8a27; color: white; font-weight: bold; text-align: center;">
            <th style="width: 160px;">إجمالي المسحات والزيارات</th>
            <th style="width: 160px;">العملاء الجدد (Leads)</th>
            <th style="width: 160px;">نقرات طلب اللحوم</th>
            <th style="width: 160px;">نسبة التحويل للطلب</th>
            <th style="width: 160px;">تقييمات الجودة المسجلة</th>
          </tr>
          <tr style="text-align: center; font-weight: bold; font-size: 16px;">
            <td style="color: #df8a27;">${scans.length}</td>
            <td style="color: #059669;">${leads.length}</td>
            <td style="color: #2563eb;">${orderClicks.length}</td>
            <td style="color: #7c3aed;">${conversionRate}%</td>
            <td style="color: #d97706;">${ratings.length}</td>
          </tr>
        </table>

        <!-- Leads Section -->
        <h3 style="color: #df8a27; font-family: Arial; margin-top: 25px;">1. العملاء الراغبين بالخصم والكوبونات (${leads.length})</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Arial; font-size: 13px; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #df8a27; color: #ffffff; font-weight: bold;">
              <th style="width: 50px;">#</th>
              <th style="width: 180px;">اسم العميل</th>
              <th style="width: 150px;">رقم الهاتف</th>
              <th style="width: 160px;">كود الخصم الممنوح</th>
              <th style="width: 200px;">تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            ${
              leads.length > 0
                ? leads
                    .map(
                      (l: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: right; font-weight: bold;">${l.name || "عميل المركزية"}</td>
                <td style="mso-number-format:'\\@'; text-align: center; color: #df8a27; font-weight: bold;">${l.contact}</td>
                <td style="mso-number-format:'\\@'; text-align: center; background-color: #fef3c7; font-weight: bold;">${l.promoCode}</td>
                <td style="text-align: center;">${formatArabicDate(l.createdAt)}</td>
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="5" style="text-align: center; padding: 10px;">لا يوجد عملاء مسجلين في هذه الفترة</td></tr>`
            }
          </tbody>
        </table>

        <!-- Top Visited Items -->
        <h3 style="color: #df8a27; font-family: Arial; margin-top: 25px;">2. حركة الأصناف والمسحات الأكثر طلباً</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Arial; font-size: 13px;">
          <thead>
            <tr style="background-color: #df8a27; color: #ffffff; font-weight: bold;">
              <th style="width: 50px;">#</th>
              <th style="width: 250px;">الصنف / القسم</th>
              <th style="width: 140px;">عدد مرات المسح</th>
              <th style="width: 140px;">النسبة من الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${
              sortedScans.length > 0
                ? sortedScans
                    .slice(0, 10)
                    .map(([key, count], idx) => {
                      const pct = scans.length > 0 ? ((count / scans.length) * 100).toFixed(1) : "0";
                      return `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: right; font-weight: bold;">${productLabels[key] || key}</td>
                <td style="text-align: center; font-weight: bold; color: #df8a27;">${count}</td>
                <td style="text-align: center;">${pct}%</td>
              </tr>`;
                    })
                    .join("")
                : `<tr><td colspan="4" style="text-align: center; padding: 10px;">لا توجد مسحات في هذه الفترة</td></tr>`
            }
          </tbody>
        </table>`;
    }

    // Generate Full HTML Excel Document with RTL support
    const excelDoc = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>تقرير المركزية</x:Name>
    <x:WorksheetOptions>
     <x:DisplayRightToLeft/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body { font-family: Arial, Tahoma, sans-serif; font-size: 13px; color: #222; }
  table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
  th { background-color: #df8a27; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cccccc; text-align: center; }
  td { border: 1px solid #cccccc; padding: 6px; }
  h1, h2, h3 { font-family: Arial, Tahoma, sans-serif; }
</style>
</head>
<body dir="rtl">
  ${tableHtml}
</body>
</html>`;

    return new Response(excelDoc, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting daily report Excel:", error);
    return NextResponse.json({ error: "فشل تصدير التقرير" }, { status: 500 });
  }
}
