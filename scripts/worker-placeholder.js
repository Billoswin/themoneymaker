// Worker entrypoint (M2+): zKill ingestion loop.
// This is intentionally plain JS so the container can run it without TS tooling.

const DATABASE_URL = process.env.DATABASE_URL;
const ZKILL_BASE_URL = process.env.ZKILL_BASE_URL || "https://zkillboard.com";
const ZKILL_USER_AGENT = process.env.ZKILL_USER_AGENT;
const GSF_ALLIANCE_ID = process.env.GSF_ALLIANCE_ID;
const ESI_BASE_URL = process.env.ESI_BASE_URL || "https://esi.evetech.net/latest";

if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!ZKILL_USER_AGENT) throw new Error("ZKILL_USER_AGENT is required");
if (!GSF_ALLIANCE_ID) throw new Error("GSF_ALLIANCE_ID is required");

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": ZKILL_USER_AGENT,
      "Accept-Encoding": "gzip",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fetch failed ${res.status} ${url} :: ${txt}`);
  }
  return await res.json();
}

async function main() {
  // Lazy import so we only pay for Prisma in worker mode.
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  console.log(`[worker] starting zKill ingestion for allianceID=${GSF_ALLIANCE_ID}`);

  // MVP ingestion: poll pastSeconds=3600 for new losses and upsert by killmailId.
  // Later: add cursors/backfill + R2Z2 for real-time.
  while (true) {
    try {
      const url = `${ZKILL_BASE_URL}/api/losses/allianceID/${encodeURIComponent(
        GSF_ALLIANCE_ID,
      )}/pastSeconds/3600/`;

      const rows = await fetchJson(url);

      if (Array.isArray(rows)) {
        for (const row of rows) {
          const killmailId = row.killmail_id ?? row.killID;
          if (!Number.isInteger(killmailId)) continue;

          const hash = row.zkb?.hash ?? row.hash ?? null;
          const killTimeStr = row.killmail_time ?? row.killTime;
          const killTime = killTimeStr ? new Date(killTimeStr) : null;
          if (!killTime || Number.isNaN(killTime.getTime())) continue;

          await prisma.zkbEvent.upsert({
            where: { killmailId },
            update: {
              hash,
              killTime,
              victimCorpId: row.victim?.corporation_id ?? null,
              victimAllianceId: row.victim?.alliance_id ?? null,
              shipTypeId: row.victim?.ship_type_id ?? null,
              systemId: row.solar_system_id ?? null,
              regionId: row.zkb?.locationID ?? null,
              totalValue: row.zkb?.totalValue ?? row.zkb?.total_value ?? null,
              isLoss: true,
              rawJson: row,
            },
            create: {
              killmailId,
              hash,
              killTime,
              victimCorpId: row.victim?.corporation_id ?? null,
              victimAllianceId: row.victim?.alliance_id ?? null,
              shipTypeId: row.victim?.ship_type_id ?? null,
              systemId: row.solar_system_id ?? null,
              regionId: row.zkb?.locationID ?? null,
              totalValue: row.zkb?.totalValue ?? row.zkb?.total_value ?? null,
              isLoss: true,
              rawJson: row,
            },
          });
        }
      }

      console.log(`[worker] ingested batch size=${Array.isArray(rows) ? rows.length : 0}`);
    } catch (err) {
      console.error("[worker] ingest error", err);
    }

    try {
      // Materialize campaign membership (simple implementation).
      const campaigns = await prisma.campaign.findMany({
        include: { scopes: true },
        orderBy: { startAt: "desc" },
      });

      for (const c of campaigns) {
        // Clear and recompute. (Safe but can be optimized later.)
        await prisma.campaignMembership.deleteMany({ where: { campaignId: c.id } });

        const allianceIds = c.scopes.map((s) => s.allianceId).filter((v) => typeof v === "number");
        const regionIds = c.scopes.map((s) => s.regionId).filter((v) => typeof v === "number");
        const systemIds = c.scopes.map((s) => s.systemId).filter((v) => typeof v === "number");

        const where = {
          killTime: { gte: c.startAt, lte: c.endAt },
          ...(allianceIds.length ? { victimAllianceId: { in: allianceIds } } : {}),
          ...(regionIds.length ? { regionId: { in: regionIds } } : {}),
          ...(systemIds.length ? { systemId: { in: systemIds } } : {}),
        };

        const matches = await prisma.zkbEvent.findMany({
          where,
          select: { killmailId: true },
          take: 5000,
        });

        if (matches.length) {
          await prisma.campaignMembership.createMany({
            data: matches.map((m) => ({ campaignId: c.id, killmailId: m.killmailId })),
            skipDuplicates: true,
          });
        }
      }
    } catch (err) {
      console.error("[worker] campaign materialize error", err);
    }

    try {
      // Enrich up to 25 missing killmails per loop.
      const missing = await prisma.zkbEvent.findMany({
        where: { hash: { not: null }, killmail: null },
        orderBy: { killTime: "desc" },
        take: 25,
      });

      for (const ev of missing) {
        const kmUrl = `${ESI_BASE_URL}/killmails/${ev.killmailId}/${ev.hash}/?datasource=tranquility`;
        const res = await fetch(kmUrl, { headers: { "User-Agent": ZKILL_USER_AGENT } });
        if (!res.ok) {
          const txt = await res.text();
          console.error(`[worker] ESI killmail fetch failed ${res.status} id=${ev.killmailId}`, txt);
          continue;
        }
        const km = await res.json();

        const victimShipTypeId = km?.victim?.ship_type_id ?? null;
        const killTime = new Date(km.killmail_time);
        const solarSystemId = km.solar_system_id;

        await prisma.killmail.upsert({
          where: { killmailId: ev.killmailId },
          update: {
            killTime,
            solarSystemId,
            victimShipTypeId,
            rawJson: km,
          },
          create: {
            killmailId: ev.killmailId,
            killTime,
            solarSystemId,
            victimShipTypeId,
            rawJson: km,
          },
        });

        // Replace items for this killmail (idempotent).
        await prisma.killmailItem.deleteMany({ where: { killmailId: ev.killmailId } });
        const items = Array.isArray(km.items) ? km.items : [];
        if (items.length) {
          await prisma.killmailItem.createMany({
            data: items.map((it) => ({
              killmailId: ev.killmailId,
              typeId: it.item_type_id,
              flag: it.flag ?? null,
              singleton: it.singleton ?? null,
              qtyDropped: it.quantity_dropped ?? null,
              qtyDestroyed: it.quantity_destroyed ?? null,
            })),
          });
        }

        // Cache type names for ship + modules (best-effort).
        const typeIds = new Set();
        if (victimShipTypeId) typeIds.add(victimShipTypeId);
        for (const it of items) {
          if (Number.isInteger(it.item_type_id)) typeIds.add(it.item_type_id);
        }
        const typeIdList = Array.from(typeIds).slice(0, 500);
        if (typeIdList.length) {
          const existing = await prisma.eveTypeCache.findMany({
            where: { typeId: { in: typeIdList } },
            select: { typeId: true },
          });
          const have = new Set(existing.map((e) => e.typeId));
          const missingIds = typeIdList.filter((id) => !have.has(id));
          if (missingIds.length) {
            const namesRes = await fetch(`${ESI_BASE_URL}/universe/names/?datasource=tranquility`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": ZKILL_USER_AGENT,
              },
              body: JSON.stringify(missingIds),
            });
            if (namesRes.ok) {
              const names = await namesRes.json();
              if (Array.isArray(names)) {
                await prisma.eveTypeCache.createMany({
                  data: names
                    .filter((n) => n && n.category === "inventory_type" && Number.isInteger(n.id) && typeof n.name === "string")
                    .map((n) => ({ typeId: n.id, name: n.name, category: n.category })),
                  skipDuplicates: true,
                });
              }
            }
          }
        }
      }

      if (missing.length) {
        console.log(`[worker] enriched killmails=${missing.length}`);
      }
    } catch (err) {
      console.error("[worker] enrich error", err);
    }

    await sleep(60_000);
  }
}

main().catch((e) => {
  console.error("[worker] fatal", e);
  process.exit(1);
});

