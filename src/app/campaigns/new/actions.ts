"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export async function createCampaign(formData: FormData) {
  const name = formData.get("name");
  const startAt = formData.get("startAt");
  const endAt = formData.get("endAt");

  if (typeof name !== "string" || !name.trim()) return;
  if (typeof startAt !== "string" || typeof endAt !== "string") return;

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

  const allianceIds = (formData.get("allianceIds") ?? "")
    .toString()
    .split(/[,\\s]+/)
    .filter(Boolean)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  const regionIds = (formData.get("regionIds") ?? "")
    .toString()
    .split(/[,\\s]+/)
    .filter(Boolean)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  const systemIds = (formData.get("systemIds") ?? "")
    .toString()
    .split(/[,\\s]+/)
    .filter(Boolean)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  const campaign = await prisma.campaign.create({
    data: {
      name: name.trim(),
      startAt: start,
      endAt: end,
      scopes: {
        create: [
          ...allianceIds.map((id) => ({ allianceId: id })),
          ...regionIds.map((id) => ({ regionId: id })),
          ...systemIds.map((id) => ({ systemId: id })),
        ],
      },
    },
  });

  redirect(`/campaigns/${campaign.id}`);
}

