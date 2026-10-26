import { NextResponse, type NextRequest } from "next/server";
import { adminEnabled, isAuthorized } from "@/lib/admin-auth";

// Protects /admin with HTTP Basic Auth (ADMIN_USER / ADMIN_PASSWORD).
// If the variables are not set, the admin is closed entirely.

export function middleware(req: NextRequest) {
  if (!adminEnabled()) {
    return new NextResponse("Admin is disabled: set ADMIN_USER and ADMIN_PASSWORD.", { status: 503 });
  }

  if (isAuthorized(req.headers.get("authorization"))) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Orders", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
