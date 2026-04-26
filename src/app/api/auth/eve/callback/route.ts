import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { encryptString } from "@/lib/crypto";
import {
  exchangeCodeForToken,
  parseCharacterIdFromSub,
  verifyAccessToken,
} from "@/lib/evesso";
import { getUserId, verifyState } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.json({ error: "Missing code/state" }, { status: 400 });
  }

  const statePayload = verifyState<{ userId: string }>(state);
  const cookieUserId = getUserId();
  if (!cookieUserId) {
    return NextResponse.json({ error: "Missing session cookie" }, { status: 400 });
  }
  if (statePayload.userId !== cookieUserId) {
    return NextResponse.json({ error: "State mismatch" }, { status: 400 });
  }

  const token = await exchangeCodeForToken(code);
  const claims = await verifyAccessToken(token.access_token);

  const eveCharacterId = parseCharacterIdFromSub(claims.sub);
  const name = typeof claims.name === "string" ? claims.name : `Character ${eveCharacterId}`;
  const ownerHash = typeof claims.owner === "string" ? claims.owner : null;
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);

  const user = await prisma.user.upsert({
    where: { id: cookieUserId },
    update: {},
    create: { id: cookieUserId },
  });

  const character = await prisma.eveCharacter.upsert({
    where: { eveCharacterId },
    update: { name, ownerHash },
    create: {
      userId: user.id,
      eveCharacterId,
      name,
      ownerHash,
    },
  });

  await prisma.eveToken.upsert({
    where: { characterId: character.id },
    update: {
      refreshTokenEnc: encryptString(token.refresh_token),
      accessTokenEnc: encryptString(token.access_token),
      accessTokenExpiresAt: expiresAt,
      scopes: Array.isArray(claims.scp) ? claims.scp.join(" ") : "",
      tokenClaimsJson: claims as unknown as object,
    },
    create: {
      characterId: character.id,
      refreshTokenEnc: encryptString(token.refresh_token),
      accessTokenEnc: encryptString(token.access_token),
      accessTokenExpiresAt: expiresAt,
      scopes: Array.isArray(claims.scp) ? claims.scp.join(" ") : "",
      tokenClaimsJson: claims as unknown as object,
    },
  });

  return NextResponse.redirect(new URL("/login", url));
}

