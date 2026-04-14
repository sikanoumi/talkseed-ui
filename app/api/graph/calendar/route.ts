// app/api/graph/calendar/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "disabled",
      message:
        "Graph direct route is disabled. Use FastAPI /calendar instead.",
    },
    { status: 410 }
  );
}