import Link from "next/link";

import { createCampaign } from "./actions";

export const dynamic = "force-dynamic";

export default function NewCampaignPage() {
  const now = new Date();
  const startDefault = now.toISOString().slice(0, 16);
  const endDefault = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 16);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/campaigns" className="text-sm text-zinc-500 underline underline-offset-2">
          ← Campaigns
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New campaign</h1>
      </header>

      <form
        action={createCampaign}
        className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="startAt">
              Start
            </label>
            <input
              id="startAt"
              name="startAt"
              type="datetime-local"
              defaultValue={startDefault}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="endAt">
              End
            </label>
            <input
              id="endAt"
              name="endAt"
              type="datetime-local"
              defaultValue={endDefault}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="allianceIds">
            Alliance IDs (comma/space separated)
          </label>
          <input
            id="allianceIds"
            name="allianceIds"
            placeholder="e.g. 1354830081"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="regionIds">
            Region IDs (comma/space separated)
          </label>
          <input
            id="regionIds"
            name="regionIds"
            placeholder="e.g. 10000060"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="systemIds">
            System IDs (comma/space separated)
          </label>
          <input
            id="systemIds"
            name="systemIds"
            placeholder="e.g. 30004759"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Create campaign
        </button>
      </form>
    </div>
  );
}

