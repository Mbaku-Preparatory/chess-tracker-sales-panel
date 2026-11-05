"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/Badge";
import { GrantDialog } from "@/components/GrantDialog";
import { TermsDialog } from "@/components/TermsDialog";
import { VoidGrantDialog } from "@/components/VoidGrantDialog";
import { ACTIONS, daysUntil, formatAmount, formatDate, formatMoney, FUNNEL, HEALTH, PRICE_GROUPS, STATUS } from "@/lib/format";
import {
  useGetAuditTrailQuery,
  useGetGrantsQuery,
  useGetUserQuery,
  type Grant,
  type Health,
} from "@/redux/api/adminApi";

function Stat({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs tracking-[0.06em] text-gray-500 uppercase dark:text-gray-400">{label}</dt>
      <dd className="mt-1 break-words text-gray-900 dark:text-gray-100">{children}</dd>
      {hint && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

function HealthBreakdown({ health }: { health: Health }) {
  const parts = [
    { label: "Payment", value: health.payment, max: 4, hint: "4 active · 3 expiring · 1 lapsed · 0 churned" },
    { label: "Tenure", value: health.tenure, max: 2, hint: "Full marks at 6 months paid" },
    { label: "Engagement", value: health.engagement, max: 4, hint: "4 active this week · 2 this month · 0 longer ago" },
  ];
  return (
    <div className="space-y-2">
      {parts.map((p) => (
        <div key={p.label} title={p.hint}>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{p.label}</span>
            <span className="tabular-nums">{p.value} / {p.max}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-dark-elevated">
            <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(p.value / p.max) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-1 text-xs text-gray-500 dark:text-gray-400">Last active {formatDate(health.lastActive)}</p>
    </div>
  );
}

function GrantRow({ grant, onVoid }: { grant: Grant; onVoid: () => void }) {
  const voided = !!grant.voidedAt;
  const muted = voided ? "text-gray-400 line-through dark:text-gray-600" : "";
  return (
    <tr className="bg-white dark:bg-dark-surface">
      <td className={`px-4 py-3 whitespace-nowrap ${muted}`}>{formatDate(grant.createdAt)}</td>
      <td className="px-4 py-3">
        <span className={muted}>{grant.sourceLabel}</span>
        {grant.plan && <span className="block text-xs text-gray-500 dark:text-gray-400">{grant.plan.name}</span>}
      </td>
      <td className={`px-4 py-3 tabular-nums ${muted}`}>{grant.days}</td>
      <td className={`px-4 py-3 whitespace-nowrap ${muted}`}>
        {grant.startsAt ? `${formatDate(grant.startsAt, false)} → ${formatDate(grant.endsAt, false)}` : "—"}
      </td>
      <td className={`px-4 py-3 whitespace-nowrap tabular-nums ${muted}`}>
        {Number(grant.amount) > 0 ? formatAmount(grant.amount, grant.currency) : "Free"}
      </td>
      <td className={`px-4 py-3 font-mono text-xs ${muted}`}>{grant.reference || "—"}</td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
        {grant.createdBy}
        {grant.note && <span className="block text-gray-700 dark:text-gray-300">{grant.note}</span>}
        {voided && (
          <span className="mt-1 block text-red-600 dark:text-red-400">
            Voided by {grant.voidedBy}: {grant.voidReason}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {!voided && (
          <button type="button" onClick={onVoid} className="btn-secondary px-3 py-1 text-xs">Void</button>
        )}
      </td>
    </tr>
  );
}

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, isError } = useGetUserQuery(id);
  const { data: grants = [] } = useGetGrantsQuery(id);
  const { data: trail = [] } = useGetAuditTrailQuery({ userId: id });
  const [dialog, setDialog] = useState<"payment" | "free" | "terms" | null>(null);
  const [voiding, setVoiding] = useState<Grant | null>(null);

  if (isLoading) return <div className="card p-6 text-sm text-gray-500 dark:text-gray-400">Loading…</div>;
  if (isError) return <div className="banner-danger">Couldn&apos;t load this user.</div>;
  if (!user) return <div className="card p-6 text-sm">No such user. <Link href="/" className="text-brand-600 underline">Back to users</Link></div>;

  const sub = user.subscription;
  const status = STATUS[sub.status];
  const left = daysUntil(sub.paidUntil);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">← Users</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{user.username}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {[user.firstName, user.lastName].filter(Boolean).join(" ") || "No name"} · {user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => setDialog("payment")}>Record payment</button>
            <button type="button" className="btn-secondary" onClick={() => setDialog("free")}>Give free time</button>
            <button type="button" className="btn-secondary" onClick={() => setDialog("terms")}>Edit terms</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Subscription</h2>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
            <Stat label="Status" hint={status.hint}>
              <Badge label={status.label} variant={status.variant} />
            </Stat>
            <Stat label="Access until"
              hint={left === null ? undefined : left >= 0 ? `${left} day${left === 1 ? "" : "s"} left` : `Ended ${-left} day${left === -1 ? "" : "s"} ago`}>
              {formatDate(sub.paidUntil, false)}
            </Stat>
            <Stat label="Plan">{sub.currentPlan ?? "—"}</Stat>
            <Stat label="Lifetime paid" hint={`${sub.paidGrants} payment${sub.paidGrants === 1 ? "" : "s"}`}>
              {formatMoney(sub.lifetimePaid)}
            </Stat>
            <Stat label="Price group">{sub.priceGroup ? PRICE_GROUPS[sub.priceGroup] : "Not set yet"}</Stat>
            <Stat label="Agreed price" hint={sub.termsNote || undefined}>
              {sub.customPrice ? formatAmount(sub.customPrice, sub.customCurrency) : "Plan price"}
              {sub.foundingMember && <span className="ml-2"><Badge label="Founding member" variant="brand" /></span>}
            </Stat>
            <Stat label="Funnel">{FUNNEL[sub.funnelStage]}</Stat>
            <Stat label="Joined">{formatDate(user.dateJoined, false)}</Stat>
            <Stat label="Players · Books">{user.playersCount} · {user.booksCount}</Stat>
          </dl>
        </section>

        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Health</h2>
            {sub.health && (
              <span className="flex items-center gap-2">
                <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{sub.health.score}</span>
                <Badge label={HEALTH[sub.health.label].label} variant={HEALTH[sub.health.label].variant} />
              </span>
            )}
          </div>
          {sub.health ? (
            <HealthBreakdown health={sub.health} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No score until they have had access.</p>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Payments and grants</h2>
        <div className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs tracking-[0.06em] text-gray-500 uppercase dark:border-dark-border dark:text-gray-400">
                <th className="px-4 py-3 font-medium">Given</th>
                <th className="px-4 py-3 font-medium">Kind</th>
                <th className="px-4 py-3 font-medium">Days</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">By</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {grants.map((g) => <GrantRow key={g.id} grant={g} onVoid={() => setVoiding(g)} />)}
              {grants.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Nothing yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">History</h2>
        <div className="card divide-y divide-gray-100 dark:divide-dark-border">
          {trail.map((a) => (
            <div key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <span className="text-gray-900 dark:text-gray-100">{ACTIONS[a.action] ?? a.action}</span>
              <span className="text-gray-500 dark:text-gray-400">{a.actor} · {formatDate(a.createdAt)}</span>
            </div>
          ))}
          {trail.length === 0 && <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No changes made in the panel.</p>}
        </div>
      </section>

      {(dialog === "payment" || dialog === "free") && <GrantDialog user={user} mode={dialog} onClose={() => setDialog(null)} />}
      {dialog === "terms" && <TermsDialog user={user} onClose={() => setDialog(null)} />}
      {voiding && <VoidGrantDialog grant={voiding} onClose={() => setVoiding(null)} />}
    </div>
  );
}
