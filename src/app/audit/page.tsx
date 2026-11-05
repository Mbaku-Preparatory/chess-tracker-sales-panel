"use client";

import Link from "next/link";

import { ACTIONS, formatDate } from "@/lib/format";
import { useGetAuditTrailQuery } from "@/redux/api/adminApi";

/** A recorded value for display: nothing, null and "" all read as a dash. */
const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

/** One line of detail from an action's recorded values. */
function describe(action: string, raw: string): string {
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(raw);
  } catch {
    return "";
  }
  if (action === "grant_access") {
    const money = Number(d.amount) > 0 ? `, ${d.currency} ${d.amount}` : "";
    return `${d.days} days (${d.source})${money}${d.reference ? `, ref ${d.reference}` : ""}`;
  }
  if (action === "void_grant") return `${d.days} days${Number(d.amount) > 0 ? `, ${d.currency} ${d.amount}` : ""}: ${d.reason}`;
  if (action === "update_plan" || action === "set_terms") {
    const before = (d.before ?? {}) as Record<string, unknown>;
    const after = (d.after ?? {}) as Record<string, unknown>;
    return Object.keys(after)
      .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
      .map((k) => `${k}: ${show(before[k])} → ${show(after[k])}`)
      .join(", ");
  }
  if (action === "update_user" && Array.isArray(d.fields)) return `Changed ${d.fields.join(", ")}`;
  return "";
}

export default function AuditPage() {
  const { data: trail, isLoading, isError } = useGetAuditTrailQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Audit trail</h1>
        <p className="mt-1.5 text-base text-gray-500 dark:text-gray-400">Every change made in this panel, newest first.</p>
      </div>
      {isLoading && <div className="card p-6 text-sm text-gray-500">Loading…</div>}
      {isError && <div className="banner-danger">Couldn&apos;t load the audit trail.</div>}
      {trail && (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs tracking-[0.06em] text-gray-500 uppercase dark:border-dark-border dark:text-gray-400">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">What</th>
                <th className="px-4 py-3 font-medium">On</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {trail.map((a) => (
                <tr key={a.id} className="bg-white dark:bg-dark-surface">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.actor}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{ACTIONS[a.action] ?? a.action}</td>
                  <td className="px-4 py-3">
                    {a.targetUserId ? (
                      <Link href={`/users/${a.targetUserId}`} className="text-brand-700 hover:underline dark:text-brand-400">{a.targetLabel}</Link>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">{a.targetLabel}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{describe(a.action, a.details)}</td>
                </tr>
              ))}
              {trail.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Nothing yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
