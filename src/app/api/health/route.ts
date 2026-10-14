import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Lightweight liveness probe for load balancers (no database). */
export function GET() {
  return NextResponse.json({ ok: true, service: "lucsum" }, { status: 200 });
}
