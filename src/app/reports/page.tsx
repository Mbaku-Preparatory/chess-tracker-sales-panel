"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge, type BadgeVariant } from "@/components/Badge";
import { errorMessage, formatAmount, formatDate } from "@/lib/format";
import {
  type SupportRequest,
  useGetSupportRequestsQuery,
  useResolveSupportRequestMutation,
} from "@/redux/api/adminApi";

const CATEGORY: Record<SupportRequest["category"], { label: string; variant: BadgeVariant }> = {
  payment: { label: "Payment", variant: "warning" },
  import: { label: "Import", variant: "brand" },
  other: { label: "Something else", variant: "neutral" },
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="min-w-0 break-words text-gray-800 dark:text-gray-200">{children}</dd>
    </div>
  );
}

/** One report: the message, what was attached, and the two things to do with it. */
function Report({ r }: { r: SupportRequest }) {
  const [resolve, { isLoading, error }] = useResolveSupportRequestMutation();
  const pay = r.context.last_payment;
  const job = r.context.last_import;
  const reply = `mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.message.slice(0, 60)}`)}`;

  return (
    <article className="card flex flex-col gap-4 p-5">
      <header className="flex flex-wrap items-center gap-3">
        <Badge label={CATEGORY[r.category].label} variant={CATEGORY[r.category].variant} />
        <Link href={`/users/${r.userId}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
          {r.username}
        </Link>
        <span className="text-sm text-gray-500 dark:text-gray-400">{r.email}</span>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{formatDate(r.createdAt)}</span>
      </header>
      <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">{r.message}</p>
      <dl className="flex flex-col gap-1 text-sm">
        <Fact label="Access until">{r.context.access_until ? formatDate(r.context.access_until) : "No access"}</Fact>
        {pay && (
          <Fact label="Last payment">
            {pay.reference} · {pay.status} · {formatAmount(pay.amount, pay.currency)} · {formatDate(pay.created_at)}
          </Fact>
        )}
        {job && (
          <Fact label="Last import">
            {job.source} for {job.player} · {job.status} · {job.games_imported} games{job.error ? ` · ${job.error}` : ""}
          </Fact>
        )}
        {r.page && <Fact label="Page">{r.page}</Fact>}
        {r.client && <Fact label="Device">{r.client}</Fact>}
      </dl>
      <footer className="flex flex-wrap items-center gap-3">
        <a href={reply} className="btn-primary">Reply by email</a>
        <button
          type="button"
          className="btn-secondary"
          disabled={isLoading}
          onClick={() => resolve({ id: r.id, resolved: !r.resolvedAt })}
        >
          {r.resolvedAt ? "Reopen" : "Mark resolved"}
        </button>
        {r.resolvedAt && <span className="text-sm text-gray-500 dark:text-gray-400">Resolved {formatDate(r.resolvedAt)}</span>}
        {error && <span className="text-sm text-red-600">{errorMessage(error, "Couldn't update the report.")}</span>}
      </footer>
    </article>
  );
}

/**
 * Messages sent from the app's Help page. This is the only place they show:
 * the backend emails nobody (backend #83), so check here. "Reply by email"
 * opens a reply to the person; "Mark resolved" files it.
 */
export default function ReportsPage() {
  const [openOnly, setOpenOnly] = useState(true);
  const { data, isLoading, isError } = useGetSupportRequestsQuery({ openOnly });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="mt-1.5 text-base text-gray-500 dark:text-gray-400">
            Problems reported from the app, newest first.{data ? ` ${data.open} open.` : ""}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setOpenOnly(!openOnly)}>
          {openOnly ? "Show resolved too" : "Open only"}
        </button>
      </div>
      {isLoading && <div className="card p-6 text-sm text-gray-500">Loading…</div>}
      {isError && <div className="banner-danger">Couldn&apos;t load the reports.</div>}
      {data && (
        <div className="flex flex-col gap-4">
          {data.requests.map((r) => <Report key={r.id} r={r} />)}
          {data.requests.length === 0 && (
            <div className="card p-8 text-center text-sm text-gray-400 dark:text-gray-500">
              {openOnly ? "Nothing open." : "No reports yet."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
