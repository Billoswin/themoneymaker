import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">The Money Maker</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        EVE SSO + zKillboard ingestion + ESI fit enrichment (running in Docker on your Proxmox Ubuntu VM).
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Login / Connect characters
        </Link>
        <Link
          href="/losses"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          View losses
        </Link>
        <Link
          href="/campaigns"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Campaigns
        </Link>
        <Link
          href="/analytics"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Analytics
        </Link>
      </div>
    </div>
  );
}
