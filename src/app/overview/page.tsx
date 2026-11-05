"use client";

import Link from "next/link";

import { formatMoney, STATUS } from "@/lib/format";
import { useGetOverviewQuery } from "@/redux/api/adminApi";

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Paying now" value={count("active") + count("expiring")} hint={`of ${o.users} accounts`} href="/?status=paying" />
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
