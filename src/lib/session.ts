import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "tmm_user";

function getKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET is required");
  return crypto.createHash("sha256").update(secret).digest();
}

export function getOrCreateUserId(): string {
  // Next 15 types `cookies()` as async in some contexts; runtime supports sync usage.
  // Cast to avoid TS build break while keeping behavior.
  const store = cookies() as unknown as {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, opts: {
      httpOnly: boolean;
      sameSite: "lax" | "strict" | "none";
      secure: boolean;
      path: string;
      maxAge: number;
    }) => void;
  };
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export function clearUserId() {
  const store = cookies() as unknown as {
    set: (name: string, value: string, opts: { path: string; maxAge: number }) => void;
  };
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function signState(payload: object): string {
  const json = JSON.stringify(payload);
  const key = getKey();
  const mac = crypto.createHmac("sha256", key).update(json).digest("base64url");
  return Buffer.from(json).toString("base64url") + "." + mac;
}

export function verifyState<T>(state: string): T {
  const [jsonB64, mac] = state.split(".");
  if (!jsonB64 || !mac) throw new Error("Invalid state");
  const json = Buffer.from(jsonB64, "base64url").toString("utf8");
  const key = getKey();
  const expected = crypto.createHmac("sha256", key).update(json).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
    throw new Error("Invalid state signature");
  }
  return JSON.parse(json) as T;
}

