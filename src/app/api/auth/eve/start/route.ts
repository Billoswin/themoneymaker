import { NextResponse } from "next/server";

import { getAuthorizeUrl } from "@/lib/evesso";
import { getOrCreateUserId, signState } from "@/lib/session";

export async function GET() {
  const userId = getOrCreateUserId();
  const state = signState({ userId, ts: Date.now() });
  const url = getAuthorizeUrl({ state });
  return NextResponse.redirect(url);
}

