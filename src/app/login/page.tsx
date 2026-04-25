import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getOrCreateUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const userId = getOrCreateUserId();
  const characters = await prisma.eveCharacter.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { token: true },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm text-zinc-500 underline underline-offset-2">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">EVE SSO</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect one or more characters. You can re-run “Connect character” to add more.
        </p>
      </header>

      <div className="flex gap-3">
        <a
          href="/api/auth/eve/start"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Connect character
        </a>
      </div>

      {characters.length === 0 ? (
        <p className="text-sm text-zinc-500">No characters connected yet.</p>
      ) : (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">Connected characters</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {characters.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="truncate text-xs text-zinc-500">
                    character_id={c.eveCharacterId}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-zinc-500">
                  {c.token?.accessTokenExpiresAt
                    ? `token expires ${c.token.accessTokenExpiresAt.toISOString()}`
                    : "no token expiry stored"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

