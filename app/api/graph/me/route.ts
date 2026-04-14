// app/api/graph/me/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "disabled",
      message: "Graph direct route is disabled. Use FastAPI /me instead.",
    },
    { status: 410 }
  );
}