import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { startAt: "desc" },
    include: { _count: { select: { scopes: true, members: true } } },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm text-zinc-500 underline underline-offset-2">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Campaigns are filter-based (start/end + alliances + regions/systems). Membership is materialized by the worker.
        </p>
      </header>

      <div className="flex gap-3">
        <Link
          href="/campaigns/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-zinc-500">No campaigns yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/campaigns/${c.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  {c.name}
                </Link>
                <span className="text-xs text-zinc-500">
                  {c.startAt.toISOString()} → {c.endAt.toISOString()}
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                scopes={c._count.scopes} · members={c._count.members}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

