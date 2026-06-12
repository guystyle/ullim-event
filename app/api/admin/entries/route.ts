import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * 운영자용 — 당첨자/응모 현황 조회.
 * GET /api/admin/entries?token=<ADMIN_TOKEN>
 */
export async function GET(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: "admin_disabled" }, { status: 503 });
  }

  const url = new URL(req.url);
  const provided =
    url.searchParams.get("token") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (!safeEqual(provided, adminToken)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = getStore();
  const [winners, totalEntries] = await Promise.all([
    store.getWinners(),
    store.getEntryCount(),
  ]);

  return NextResponse.json({ winners, totalEntries });
}
