import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LossDetailPage(props: { params: Promise<{ killmailId: string }> }) {
  const params = await props.params;
  const killmailId = Number(params.killmailId);
  if (!Number.isInteger(killmailId)) notFound();

  const km = await prisma.killmail.findUnique({
    where: { killmailId },
    include: {
      items: { orderBy: [{ flag: "asc" }, { typeId: "asc" }] },
    },
  });
  if (!km) notFound();

  const typeIds = Array.from(new Set([km.victimShipTypeId, ...km.items.map((i) => i.typeId)].filter((v): v is number => typeof v === "number")));
  const types = typeIds.length
    ? await prisma.eveTypeCache.findMany({ where: { typeId: { in: typeIds } } })
    : [];
  const nameById = new Map(types.map((t) => [t.typeId, t.name]));

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/losses" className="text-sm text-zinc-500 underline underline-offset-2">
          ← Losses
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Killmail {killmailId}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {km.victimShipTypeId
            ? nameById.get(km.victimShipTypeId) ?? `ship_type_id=${km.victimShipTypeId}`
            : "Unknown ship"}{" "}
          · system_id={km.solarSystemId} · {km.killTime.toISOString()}
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Fit items (raw flags)</h2>
        {km.items.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No items recorded.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {km.items.map((it) => (
              <li key={it.id} className="flex flex-wrap justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-medium">
                    {nameById.get(it.typeId) ?? `type_id=${it.typeId}`}
                  </span>{" "}
                  <span className="text-zinc-500">
                    flag={it.flag ?? "?"}
                  </span>
                </span>
                <span className="shrink-0 text-zinc-500">
                  dropped={it.qtyDropped ?? 0} destroyed={it.qtyDestroyed ?? 0}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

