import { NextRequest, NextResponse } from "next/server";
import { isUnsupportedCandidateDevice } from "@/lib/device-detection";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const candidatePath = path.startsWith("/assess/") || path.startsWith("/assessment");
  if (candidatePath && path !== "/assessment/unsupported" && isUnsupportedCandidateDevice(request.headers)) {
    return NextResponse.redirect(new URL("/assessment/unsupported", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/assess/:path*", "/assessment/:path*"],
};
