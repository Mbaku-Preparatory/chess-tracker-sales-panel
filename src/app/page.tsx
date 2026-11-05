"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useMemo, useState } from "react";

import { Badge } from "@/components/Badge";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import {
  BanIcon,
  ChevronRightIcon,
  PencilIcon,
  RefreshIcon,
  TrashIcon,
  UndoIcon,
} from "@/components/icons";
import { daysUntil, formatDate, FUNNEL, HEALTH, STATUS } from "@/lib/format";
import {
  useGetUsersQuery,
  useSetUserDisabledMutation,
  type AdminUser,
} from "@/redux/api/adminApi";

const th = "px-4 py-3 font-medium";

// Pinned to the card's right edge: on a phone the table is wider than the card,
// and these are what the page is for. bg-inherit takes the row's colour, so every
// row's background must be opaque or the columns scrolling underneath show through.
const pinned = "sticky right-0 border-l border-gray-100 bg-inherit dark:border-dark-border";

function StatusBadges({ user }: { user: AdminUser }) {
  return (
    <div className="flex flex-wrap gap-1">
      {user.isActive ? (
        <Badge label="Verified" variant="success" />
      ) : (
        <Badge label="Unverified" variant="warning" />
      )}
      {user.isDisabled && <Badge label="Suspended" variant="danger" />}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs tracking-[0.06em] text-gray-500 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-gray-900 dark:text-gray-100">{children}</dd>
    </div>
  );
}

function SubscriptionCell({ user }: { user: AdminUser }) {
  const sub = user.subscription;
  const status = STATUS[sub.status];
  const left = daysUntil(sub.paidUntil);
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge label={status.label} variant={status.variant} title={status.hint} />
      {sub.paidUntil && (
        <span className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
          {left !== null && left >= 0 ? `until ${formatDate(sub.paidUntil, false)}` : `ended ${formatDate(sub.paidUntil, false)}`}
        </span>
      )}
    </div>
  );
}

function HealthCell({ user }: { user: AdminUser }) {
  const h = user.subscription.health;
  if (!h) return <span className="text-gray-400 dark:text-gray-600">—</span>;
  const look = HEALTH[h.label];
  return (
    <span className="flex items-center gap-2" title={`Payment ${h.payment}/4 · Tenure ${h.tenure}/2 · Engagement ${h.engagement}/4`}>
      <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{h.score}</span>
      <Badge label={look.label} variant={look.variant} />
    </span>
  );
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Everyone" },
  { value: "paying", label: "Paying now" },
  { value: "active", label: STATUS.active.label },
  { value: "expiring", label: STATUS.expiring.label },
  { value: "lapsed", label: STATUS.lapsed.label },
  { value: "churned", label: STATUS.churned.label },
  { value: "never", label: "Never subscribed" },
];

function matchesStatus(user: AdminUser, filter: string): boolean {
  if (!filter) return true;
  const s = user.subscription.status;
  return filter === "paying" ? s === "active" || s === "expiring" : s === filter;
}

export default function UsersPage() {
  // useSearchParams needs a Suspense boundary for the static build.
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-gray-500 dark:text-gray-400">Loading users…</div>}>
      <UsersList />
    </Suspense>
  );
}

function UsersList() {
  const { data: allUsers, isLoading, isError, error, refetch } = useGetUsersQuery();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const statusFilter = params.get("status") ?? "";
  const [search, setSearch] = useState("");

  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allUsers?.filter(
      (u) =>
        matchesStatus(u, statusFilter) &&
        (!q || [u.username, u.email, u.firstName, u.lastName].some((v) => v.toLowerCase().includes(q))),
    );
  }, [allUsers, statusFilter, search]);

  const setStatusFilter = (value: string) =>
    router.replace(value ? `${pathname}?status=${value}` : pathname, { scroll: false });
  const [setUserDisabled, { isLoading: isToggling }] = useSetUserDisabledMutation();

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const toggleDetails = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Users
          </h1>
          <p className="mt-1.5 text-base text-gray-500 dark:text-gray-400">
            {users && allUsers
              ? users.length === allUsers.length
                ? `${users.length} account${users.length === 1 ? "" : "s"}`
                : `${users.length} of ${allUsers.length} accounts`
              : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          aria-label="Refresh users"
          title="Refresh"
          className="btn-icon"
        >
          <RefreshIcon />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          className="field max-w-xs"
          placeholder="Search name, username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search users"
        />
        <select className="field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by subscription">
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="card p-6 text-sm text-gray-500 dark:text-gray-400">Loading users…</div>
      )}

      {isError && (
        <div className="banner-danger">Couldn&apos;t load users: {JSON.stringify(error)}</div>
      )}

      {users && (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-white text-xs tracking-[0.06em] text-gray-500 uppercase dark:border-dark-border dark:bg-dark-surface dark:text-gray-400">
                <th scope="col" className="w-px">
                  <span className="sr-only">Details</span>
                </th>
                <th scope="col" className={th}>Username</th>
                <th scope="col" className={th}>Account</th>
                <th scope="col" className={th}>Subscription</th>
                <th scope="col" className={th}>Health</th>
                <th scope="col" className={th}>Players</th>
                <th scope="col" className={th}>Books</th>
                <th scope="col" className={th}>Joined</th>
                <th scope="col" className={`${th} ${pinned} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {users.map((user) => {
                const open = expanded.has(user.id);
                const detailsId = `user-details-${user.id}`;

                return (
                  <Fragment key={user.id}>
                    <tr
                      // Anywhere on the row opens it, except a button, which does
                      // what it says.
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest("button, a")) toggleDetails(user.id);
                      }}
                      className={`cursor-pointer ${
                        user.isDisabled
                          ? "bg-gray-50 dark:bg-dark-elevated"
                          : "bg-white hover:bg-gray-50 dark:bg-dark-surface dark:hover:bg-dark-elevated"
                      }`}
                    >
                      <td className="w-px py-3 pl-3">
                        <button
                          type="button"
                          onClick={() => toggleDetails(user.id)}
                          aria-expanded={open}
                          aria-controls={open ? detailsId : undefined}
                          aria-label={`${open ? "Hide" : "Show"} details for ${user.username}`}
                          title={open ? "Hide details" : "Show details"}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-gray-500 dark:hover:text-gray-100"
                        >
                          <ChevronRightIcon
                            className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        <Link
                          href={`/users/${user.id}`}
                          className="hover:text-brand-700 hover:underline dark:hover:text-brand-400"
                        >
                          {user.username}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadges user={user} />
                      </td>
                      <td className="px-4 py-3">
                        <SubscriptionCell user={user} />
                      </td>
                      <td className="px-4 py-3">
                        <HealthCell user={user} />
                      </td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums dark:text-gray-300">
                        {user.playersCount}
                      </td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums dark:text-gray-300">
                        {user.booksCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {formatDate(user.dateJoined)}
                      </td>
                      <td className={`${pinned} px-4 py-3`}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditing(user)}
                            aria-label={`Edit ${user.username}`}
                            title="Edit"
                            className="btn-icon"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() =>
                              setUserDisabled({ id: user.id, disabled: !user.isDisabled })
                            }
                            aria-label={
                              user.isDisabled
                                ? `Reactivate ${user.username}`
                                : `Deactivate ${user.username}`
                            }
                            title={user.isDisabled ? "Reactivate" : "Deactivate"}
                            className="btn-icon"
                          >
                            {user.isDisabled ? <UndoIcon /> : <BanIcon />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(user)}
                            aria-label={`Delete ${user.username}`}
                            title="Delete permanently"
                            className="btn-icon hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900/60 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr id={detailsId} className="bg-gray-50 dark:bg-dark-elevated/50">
                        <td colSpan={9} className="px-4 py-3">
                          {/* Sticky and capped on a phone, where the row is wider
                              than the card: the details stay in view, not out past
                              the scroll. */}
                          <dl className="sticky left-4 grid max-w-[calc(100vw-4.25rem)] gap-x-8 gap-y-3 pl-10 sm:max-w-none sm:grid-cols-[1fr_1.5fr_1fr_1fr]">
                            <Detail label="Name">
                              {user.firstName || user.lastName
                                ? `${user.firstName} ${user.lastName}`.trim()
                                : "—"}
                            </Detail>
                            <Detail label="Email">{user.email}</Detail>
                            <Detail label="Last login">{formatDate(user.lastLogin)}</Detail>
                            <Detail label="Funnel">{FUNNEL[user.subscription.funnelStage]}</Detail>
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    {allUsers?.length ? "No one matches." : "No users yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
