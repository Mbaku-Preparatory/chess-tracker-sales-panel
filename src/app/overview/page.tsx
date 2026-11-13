"use client";

import Link from "next/link";
import { useState } from "react";

import { SpinnerIcon } from "@/components/icons";
import { errorMessage, formatMoney, STATUS } from "@/lib/format";
import {
  NO_SOURCE,
  useGetOverviewQuery,
  useGetSignupSourcesQuery,
  useSendRemindersMutation,
  type Overview,
  type ReminderRun,
} from "@/redux/api/adminApi";

function Card({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs tracking-[0.06em] text-gray-500 uppercase dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition-colors hover:border-brand-300 dark:hover:border-brand-700">{body}</Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function describeRun(r: ReminderRun): string {
  const sent = r.sentEnding + r.sentEnded;
  if (sent === 0 && r.failed === 0) return "Nobody was due a reminder.";
  const parts = [`Sent ${plural(sent, "reminder")}: ${r.sentEnding} ending soon, ${r.sentEnded} ended.`];
  if (r.failed) parts.push(`${plural(r.failed, "email")} could not be sent; check the mail settings.`);
  if (r.leftForNextRun) parts.push(`${r.leftForNextRun} more will go on the next press.`);
  return parts.join(" ");
}

/**
 * The paywall's state and the reminder button. Reminders go to everyone whose
 * access ends within 3 days or ended in the last 3, once per end date, so
 * pressing it twice sends nothing twice. The same thing runs from
 * `manage.py send_access_reminders` on a schedule.
 */
function Paywall({ o }: { o: Overview }) {
  const [send, { isLoading, error, reset }] = useSendRemindersMutation();
  const [result, setResult] = useState<ReminderRun | null>(null);

  const onSend = async () => {
    reset();
    setResult(null);
    try {
      setResult(await send().unwrap());
    } catch {
      // Shown below.
    }
  };

  return (
    <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Paywall {o.paywallOn ? "on" : "off"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {o.paywallOn
            ? `${plural(o.onTrial, "account")} on the free trial · ${plural(o.remindersDue, "reminder")} due now`
            : "Everyone can use the app. Set SUBSCRIPTIONS_ENFORCED on the API to switch it on, then run start_trials."}
        </p>
        {result && <p role="status" className="mt-2 text-sm text-brand-700 dark:text-brand-300">{describeRun(result)}</p>}
        {error && <p className="banner-danger mt-2">{errorMessage(error, "Couldn't send the reminders.")}</p>}
      </div>
      <button type="button" className="btn-primary shrink-0" onClick={onSend} disabled={!o.paywallOn || isLoading}
        title={o.paywallOn ? undefined : "Nothing is ending while the paywall is off"}>
        {isLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
        Send reminders
      </button>
    </section>
  );
}

/**
 * Which channels bring sign-ups, and which bring people who pay. "Paid" is
 * ever paid (a Paystack or hand-recorded payment); trials and free time are not.
 * Accounts made before sources were recorded sit under "No source recorded".
 */
function Sources() {
  const { data: rows, isError } = useGetSignupSourcesQuery();
  const td = "px-3 py-2 text-right tabular-nums";
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sign-ups by source</h2>
      <p className="mt-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
        From the link&apos;s utm_source, or guessed from the site that sent them. Every account, all time.
      </p>
      {isError && <p className="banner-danger">Couldn&apos;t load the sources.</p>}
      {rows && rows.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No accounts yet.</p>}
      {rows && rows.length > 0 && (
        <div className="relative overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs tracking-[0.06em] text-gray-500 uppercase dark:border-dark-border dark:text-gray-400">
                <th scope="col" className="px-3 py-2 text-left font-medium">Source</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Sign-ups</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Paid</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Paid %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {rows.map((r) => (
                <tr key={r.source}>
                  <td className="px-3 py-2">
                    <Link href={`/?source=${encodeURIComponent(r.source)}`} className="text-gray-900 hover:underline dark:text-gray-100">
                      {r.source === NO_SOURCE ? "No source recorded" : r.source}
                    </Link>
                  </td>
                  <td className={`${td} text-gray-900 dark:text-gray-100`}>{r.signups}</td>
                  <td className={`${td} text-gray-900 dark:text-gray-100`}>{r.paid}</td>
                  <td className={`${td} text-gray-500 dark:text-gray-400`}>
                    {r.signups ? `${Math.round((100 * r.paid) / r.signups)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function OverviewPage() {
  const { data: o, isLoading, isError } = useGetOverviewQuery();
  const count = (s: keyof typeof STATUS) => o?.byStatus.find((b) => b.status === s)?.count ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Overview</h1>
        <p className="mt-1.5 text-base text-gray-500 dark:text-gray-400">Subscriptions at a glance.</p>
      </div>
      {isLoading && <div className="card p-6 text-sm text-gray-500">Loading…</div>}
      {isError && <div className="banner-danger">Couldn&apos;t load the overview.</div>}
      {o && (
        <div className="space-y-6">
          <Paywall o={o} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="With access now" value={count("active") + count("expiring")} hint={`of ${o.users} accounts, ${o.onTrial} on trial`} href="/?status=access" />
            <Card label="Expiring this week" value={o.expiringSoon} hint="Worth a reminder" href="/?status=expiring" />
            <Card label="New this month" value={o.newSubscribersThisMonth} hint="First access this month" />
            <Card label="Lapsed" value={count("lapsed")} hint="Ended in the last 30 days" href="/?status=lapsed" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card label="Revenue this month" value={formatMoney(o.revenueThisMonth)} hint="Payments recorded this month, voided ones excluded" />
            <Card label="Revenue, all time" value={formatMoney(o.revenueAllTime)} />
          </div>
          <section className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Every account by status</h2>
            <div className="flex flex-wrap gap-6">
              {o.byStatus.map((b) => (
                <Link key={b.status} href={`/?status=${b.status}`} className="text-sm hover:underline" title={STATUS[b.status].hint}>
                  <span className="text-gray-500 dark:text-gray-400">{STATUS[b.status].label}</span>{" "}
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{b.count}</span>
                </Link>
              ))}
            </div>
          </section>
          <Sources />
        </div>
      )}
    </div>
  );
}
