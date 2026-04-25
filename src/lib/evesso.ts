import { jwtVerify, createRemoteJWKSet } from "jose";

const DEFAULT_ISSUER = "https://login.eveonline.com";

export function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export function getScopes(): string[] {
  const raw = requiredEnv("EVE_SSO_SCOPES");
  return raw.split(/\s+/).filter(Boolean);
}

export function getAuthorizeUrl(params: { state: string }): URL {
  const url = new URL("https://login.eveonline.com/v2/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", requiredEnv("EVE_SSO_REDIRECT_URI"));
  url.searchParams.set("client_id", requiredEnv("EVE_SSO_CLIENT_ID"));
  url.searchParams.set("scope", getScopes().join(" "));
  url.searchParams.set("state", params.state);
  return url;
}

export async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);

  const res = await fetch("https://login.eveonline.com/v2/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${requiredEnv("EVE_SSO_CLIENT_ID")}:${requiredEnv("EVE_SSO_CLIENT_SECRET")}`,
      ).toString("base64")}`,
    },
    body,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SSO token exchange failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);

  const res = await fetch("https://login.eveonline.com/v2/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${requiredEnv("EVE_SSO_CLIENT_ID")}:${requiredEnv("EVE_SSO_CLIENT_SECRET")}`,
      ).toString("base64")}`,
    },
    body,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SSO refresh failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token: string;
  };
}

export async function verifyAccessToken(accessToken: string) {
  const jwks = createRemoteJWKSet(
    new URL("https://login.eveonline.com/oauth/jwks"),
  );
  const { payload } = await jwtVerify(accessToken, jwks, {
    issuer: DEFAULT_ISSUER,
  });
  return payload;
}

export function parseCharacterIdFromSub(sub: unknown): number {
  if (typeof sub !== "string") throw new Error("Invalid token sub");
  // commonly: "CHARACTER:EVE:<id>"
  const parts = sub.split(":");
  const idStr = parts[parts.length - 1];
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid character id");
  return id;
}

