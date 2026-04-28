import { NextResponse } from "next/server";

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message } }, { status: 403 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message } }, { status: 401 });
}

export function badRequest(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
