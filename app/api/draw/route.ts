import { NextResponse } from "next/server";
import { drawConfig } from "@/lib/config";
import { getStore, type DrawResult } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLE_RE = /^[a-z0-9._]{2,30}$/;

export async function POST(req: Request) {
  let handle: unknown;
  try {
    ({ handle } = (await req.json()) as { handle?: unknown });
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (typeof handle !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const normalized = handle.trim().replace(/^@+/, "").toLowerCase();
  if (!HANDLE_RE.test(normalized)) {
    return NextResponse.json({ error: "invalid_handle" }, { status: 400 });
  }

  const store = getStore();

  try {
    // 인스타그램 아이디당 1회만 응모 가능 (원자적 등록)
    const isNew = await store.addEntry(normalized);
    if (!isNew) {
      return NextResponse.json({ error: "already_entered" }, { status: 409 });
    }

    // 확률 추첨 후, 당첨 상한(기본 3명)을 원자적으로 확인
    let result: DrawResult = "lose";
    if (
      Math.random() < drawConfig.winProbability &&
      (await store.tryClaimWin(drawConfig.maxWinners))
    ) {
      result = "win";
    }

    await store.recordResult({
      handle: normalized,
      result,
      at: new Date().toISOString(),
    });

    return NextResponse.json({ result });
  } catch (err) {
    // 저장소 오류(예: 서버리스 읽기전용 FS, Redis 연결 실패) — 로그로 원인 노출
    console.error("[draw] 저장소 처리 실패:", err);
    return NextResponse.json({ error: "store_unavailable" }, { status: 500 });
  }
}
