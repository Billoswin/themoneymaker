import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LossesPage() {
  const losses = await prisma.zkbEvent.findMany({
    orderBy: { killTime: "desc" },
    take: 100,
    include: { killmail: true },
  });

  const shipTypeIds = Array.from(
    new Set(losses.map((l) => l.shipTypeId).filter((v): v is number => typeof v === "number")),
  );

  const shipTypes = shipTypeIds.length
    ? await prisma.eveTypeCache.findMany({ where: { typeId: { in: shipTypeIds } } })
    : [];
  const shipNameById = new Map(shipTypes.map((t) => [t.typeId, t.name]));

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm text-zinc-500 underline underline-offset-2">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Losses (GSF)</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Latest 100 ingested losses. Enrichment adds fit items when ESI killmails are fetched.
        </p>
      </header>

      {losses.length === 0 ? (
        <p className="text-sm text-zinc-500">No losses ingested yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left dark:bg-zinc-950/40">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Ship</th>
                <th className="px-3 py-2">System</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Fit</th>
              </tr>
            </thead>
            <tbody>
              {losses.map((l) => (
                <tr key={l.killmailId} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-3 py-2 text-zinc-500">{l.killTime.toISOString()}</td>
                  <td className="px-3 py-2 font-medium">
                    {l.shipTypeId ? shipNameById.get(l.shipTypeId) ?? `type_id=${l.shipTypeId}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {l.systemId ? `system_id=${l.systemId}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {typeof l.totalValue === "number" ? l.totalValue.toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {l.killmail ? (
                      <Link
                        className="text-blue-600 underline underline-offset-2 dark:text-blue-400"
                        href={`/losses/${l.killmailId}`}
                      >
                        View fit
                      </Link>
                    ) : (
                      <span className="text-zinc-500">pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

