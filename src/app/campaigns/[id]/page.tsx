import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      scopes: true,
      _count: { select: { members: true } },
    },
  });
  if (!campaign) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/campaigns" className="text-sm text-zinc-500 underline underline-offset-2">
          ← Campaigns
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {campaign.startAt.toISOString()} → {campaign.endAt.toISOString()}
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Scopes</h2>
        {campaign.scopes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No scopes configured.</p>
        ) : (
          <ul className="mt-2 text-sm text-zinc-500">
            {campaign.scopes.map((s) => (
              <li key={s.id}>
                allianceId={s.allianceId ?? "—"} regionId={s.regionId ?? "—"} systemId={s.systemId ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Membership</h2>
        <p className="mt-2 text-sm text-zinc-500">
          materialized_members={campaign._count.members} (the worker will populate this)
        </p>
      </section>
    </div>
  );
}

