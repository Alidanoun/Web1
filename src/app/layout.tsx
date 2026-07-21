import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://recipes-markzia.ddns.net"),
  title: "مطاعم وملاحم المركزية | وصفات الطهي الاحترافية",
  description: "اكتشف أفضل طرق تحضير وطهي اللحوم مع وصفات احترافية وخطوات تفصيلية من مطاعم وملاحم المركزية.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={cairo.className}>
        {children}
      </body>
    </html>
  );
}
