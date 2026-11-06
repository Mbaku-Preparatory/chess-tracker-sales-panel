"use client";

import Link from "next/link";
import { useState } from "react";

import { SpinnerIcon } from "@/components/icons";
import { errorMessage, formatMoney, STATUS } from "@/lib/format";
import { useGetOverviewQuery, useSendRemindersMutation, type Overview, type ReminderRun } from "@/redux/api/adminApi";

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
            <Card label="With access now" value={count("active") + count("expiring")} hint={`of ${o.users} accounts, ${o.onTrial} on trial`} href="/?status=paying" />
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
        </div>
      )}
    </div>
  );
}
