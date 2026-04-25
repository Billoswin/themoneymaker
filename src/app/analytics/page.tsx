import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const totalLossIskAgg = await prisma.zkbEvent.aggregate({
    where: { isLoss: true, totalValue: { not: null } },
    _sum: { totalValue: true },
  });

  const topShips = await prisma.zkbEvent.groupBy({
    by: ["shipTypeId"],
    where: { isLoss: true, shipTypeId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { shipTypeId: "desc" } },
    take: 10,
  });

  const shipTypeIds = topShips
    .map((s) => s.shipTypeId)
    .filter((v): v is number => typeof v === "number");

  const shipTypes = shipTypeIds.length
    ? await prisma.eveTypeCache.findMany({ where: { typeId: { in: shipTypeIds } } })
    : [];
  const shipNameById = new Map(shipTypes.map((t) => [t.typeId, t.name]));

  const topModules = await prisma.killmailItem.groupBy({
    by: ["typeId"],
    _count: { _all: true },
    orderBy: { _count: { typeId: "desc" } },
    take: 10,
  });

  const moduleTypeIds = topModules.map((m) => m.typeId);
  const moduleTypes = moduleTypeIds.length
    ? await prisma.eveTypeCache.findMany({ where: { typeId: { in: moduleTypeIds } } })
    : [];
  const moduleNameById = new Map(moduleTypes.map((t) => [t.typeId, t.name]));

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm text-zinc-500 underline underline-offset-2">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Basic all-time stats (v1). We’ll add date-range controls next.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">ISK spent (losses, all time)</h2>
        <p className="mt-2 text-sm text-zinc-500">
          {typeof totalLossIskAgg._sum.totalValue === "number"
            ? totalLossIskAgg._sum.totalValue.toLocaleString()
            : "—"}
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Most lost ships (all time)</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-1 pl-5 text-sm text-zinc-500">
          {topShips.map((s) => (
            <li key={String(s.shipTypeId)}>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {typeof s.shipTypeId === "number"
                  ? shipNameById.get(s.shipTypeId) ?? `type_id=${s.shipTypeId}`
                  : "unknown"}
              </span>{" "}
              — {s._count._all}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Most lost modules (all time)</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-1 pl-5 text-sm text-zinc-500">
          {topModules.map((m) => (
            <li key={m.typeId}>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {moduleNameById.get(m.typeId) ?? `type_id=${m.typeId}`}
              </span>{" "}
              — {m._count._all}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

