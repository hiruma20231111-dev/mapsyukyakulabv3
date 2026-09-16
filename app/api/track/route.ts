// 利用イベントの記録（招待トークン経由のみ）。v1 から移植。
import { verifyToken } from "@/lib/store/invite";
import { logEvent } from "@/lib/store/tracking";
import { ownerHash } from "@/lib/store/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(request: Request) {
  let b: any;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false });
  }
  const { invite, type, detail } = b || {};
  if (!invite || !type) return json({ ok: false });
  const v = verifyToken(invite);
  if (!v || !v.gk) return json({ ok: false });
  await logEvent(ownerHash(v.gk), {
    id: v.id,
    label: v.label,
    type: String(type).slice(0, 24),
    detail: String(detail || "").slice(0, 120),
  });
  return json({ ok: true });
}

function json(o: unknown) {
  return new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });
}
