import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasSecret: !!process.env.AUTH_SECRET,
    hasClientId: !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
    hasClientSecret: !!process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
  });
}