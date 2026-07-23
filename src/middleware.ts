import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Protected paths for admin dashboard & confidential data APIs
  const isProtectedPath =
    path.startsWith("/admin") ||
    path.startsWith("/api/stats") ||
    path.startsWith("/api/export-leads") ||
    path.startsWith("/api/reset") ||
    path.startsWith("/api/seed") ||
    (path.startsWith("/api/recipes") && method !== "GET");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check HTTP Basic Auth Header
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const authValue = authHeader.split(" ")[1];
    if (authValue) {
      const [user, pwd] = Buffer.from(authValue, "base64").toString("ascii").split(":");
      const expectedUser = process.env.ADMIN_USER || "admin";
      const expectedPwd = process.env.ADMIN_PASSWORD || "markzia2026";

      if (user === expectedUser && pwd === expectedPwd) {
        return NextResponse.next();
      }
    }
  }

  // If not authenticated, request HTTP Basic Auth
  return new NextResponse("الوصول محمي: يرجى إدخال اسم المستخدم وكلمة المرور الخاصة بإدارة المركزية", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Al-Markazia Admin Area"',
    },
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/stats",
    "/api/export-leads",
    "/api/reset",
    "/api/seed",
  ],
};
