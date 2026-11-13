"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useState } from "react";

import { Badge } from "@/components/Badge";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import {
  BanIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  RefreshIcon,
  TrashIcon,
  UndoIcon,
} from "@/components/icons";
import { daysUntil, formatDate, FUNNEL, HEALTH, STATUS } from "@/lib/format";
import {
  NO_SOURCE,
  useGetSignupSourcesQuery,
  useGetUsersPageQuery,
  useSetUserDisabledMutation,
  type AdminUser,
  type SignupSource,
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

/** "google / organic", or "—" for an account with no source recorded. */
function channel(s: SignupSource | null): string {
  if (!s || !s.utmSource) return "—";
  return s.utmMedium ? `${s.utmSource} / ${s.utmMedium}` : s.utmSource;
}

function SourceCell({ user }: { user: AdminUser }) {
  const s = user.signupSource;
  if (!s || !s.utmSource) return <span className="text-gray-400 dark:text-gray-600">—</span>;
  return (
    <div className="flex flex-col items-start gap-0.5" title={s.fromLink ? "From the link's utm tags" : "Guessed from the referrer"}>
      <span className="whitespace-nowrap text-gray-900 dark:text-gray-100">{channel(s)}</span>
      {s.utmCampaign && <span className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">{s.utmCampaign}</span>}
    </div>
  );
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Everyone" },
  // Paid time left. Trials and free time are under "With access now".
  { value: "paying", label: "Paying now" },
  { value: "access", label: "With access now" },
  { value: "active", label: STATUS.active.label },
  { value: "expiring", label: STATUS.expiring.label },
  { value: "lapsed", label: STATUS.lapsed.label },
  { value: "churned", label: STATUS.churned.label },
  { value: "never", label: "Never subscribed" },
];

/** Rows on screen at once. */
const PAGE_SIZE = 10;
/** Rows fetched per request: five pages, so most paging needs no request. */
const CHUNK = 50;

/** `value`, once it has stopped changing for `ms`: search waits for a pause in typing. */
function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

function Pagination({
  page, pages, first, last, count, busy, onPage,
}: {
  page: number; pages: number; first: number; last: number; count: number; busy: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm sm:flex-row dark:border-dark-border">
      <p className="text-gray-500 dark:text-gray-400">
        {count === 0 ? "No accounts" : <>Showing <span className="font-medium text-gray-900 tabular-nums dark:text-gray-100">{first}–{last}</span> of <span className="font-medium text-gray-900 tabular-nums dark:text-gray-100">{count}</span></>}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary px-3 py-1.5" disabled={page === 0 || busy} onClick={() => onPage(page - 1)}>
          <ChevronLeftIcon />
          Previous
        </button>
        <span className="px-1 text-gray-500 tabular-nums dark:text-gray-400">
          {page + 1} / {pages}
        </span>
        <button type="button" className="btn-secondary px-3 py-1.5" disabled={page >= pages - 1 || busy} onClick={() => onPage(page + 1)}>
          Next
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
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
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const statusFilter = params.get("status") ?? "";
  const sourceFilter = params.get("source") ?? "";
  const { data: sources } = useGetSignupSourcesQuery();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim(), 300);

  // A new search or filter starts again at page one. Reset while rendering
  // (React's pattern for state that follows a prop), not in an effect, so the
  // first render after the change already asks for page one. Storing the reset
  // matters: deriving page one without storing it brought the old page back
  // when the search was cleared again.
  const filterKey = `${search}\u0000${statusFilter}\u0000${sourceFilter}`;
  const [paging, setPaging] = useState({ key: filterKey, page: 0 });
  if (paging.key !== filterKey) setPaging({ key: filterKey, page: 0 });
  const page = paging.key === filterKey ? paging.page : 0;
  const setPage = (next: number) => setPaging({ key: filterKey, page: next });

  // The 50-row slice this page falls in. Pages inside it are already here;
  // crossing into the next or previous slice, or changing the search or the
  // filter, fetches afresh, never from an older copy.
  const offset = Math.floor((page * PAGE_SIZE) / CHUNK) * CHUNK;
  const { currentData, isLoading, isFetching, isError, error, refetch } = useGetUsersPageQuery(
    { search, status: statusFilter, source: sourceFilter, offset, limit: CHUNK },
    { refetchOnMountOrArgChange: true },
  );
  const count = currentData?.count ?? 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const start = page * PAGE_SIZE - offset;
  const users = currentData?.results.slice(start, start + PAGE_SIZE);
  const filtered = Boolean(search || statusFilter || sourceFilter);

  // Both filters live in the URL, so the overview can link straight to one.
  const setFilter = (name: "status" | "source", value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
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
            {currentData
              ? `${count} ${filtered ? "matching " : ""}account${count === 1 ? "" : "s"}`
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          className="field sm:max-w-xs"
          placeholder="Search name, username or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search users"
        />
        <select className="field sm:w-auto" value={statusFilter} onChange={(e) => setFilter("status", e.target.value)} aria-label="Filter by subscription">
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select className="field sm:w-auto" value={sourceFilter} onChange={(e) => setFilter("source", e.target.value)} aria-label="Filter by where they came from">
          <option value="">Every source</option>
          {/* The current filter stays selectable even before the counts arrive. */}
          {sourceFilter && !sources?.some((s) => s.source === sourceFilter) && (
            <option value={sourceFilter}>{sourceFilter === NO_SOURCE ? "No source recorded" : sourceFilter}</option>
          )}
          {sources?.map((s) => (
            <option key={s.source} value={s.source}>
              {s.source === NO_SOURCE ? "No source recorded" : s.source} ({s.signups})
            </option>
          ))}
        </select>
      </div>

      {(isLoading || (isFetching && !currentData)) && (
        <div className="card p-6 text-sm text-gray-500 dark:text-gray-400">Loading users…</div>
      )}

      {isError && (
        <div className="banner-danger">Couldn&apos;t load users: {JSON.stringify(error)}</div>
      )}

      {users && (
        <div className="card overflow-hidden">
          {/* Only the table scrolls sideways on a phone; the pager stays put.
              relative: the table's sr-only labels are absolutely positioned,
              and without a positioned box here they are placed against the
              page and stretch it sideways. */}
          <div className="relative overflow-x-auto">
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
                  <th scope="col" className={th}>Source</th>
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
                        <td className="px-4 py-3">
                          <SourceCell user={user} />
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
                          <td colSpan={10} className="px-4 py-3">
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
                              <Detail label="Came from">
                                {channel(user.signupSource)}
                                {user.signupSource && !user.signupSource.fromLink && user.signupSource.utmSource && (
                                  <span className="text-gray-500 dark:text-gray-400"> (from the referrer)</span>
                                )}
                              </Detail>
                              <Detail label="Campaign">
                                {[user.signupSource?.utmCampaign, user.signupSource?.utmTerm, user.signupSource?.utmContent]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </Detail>
                              <Detail label="First page">{user.signupSource?.landingPath || "—"}</Detail>
                              <Detail label="First visit">{formatDate(user.signupSource?.firstSeenAt)}</Detail>
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      {filtered ? "No one matches." : "No users yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pages={pages}
            first={count === 0 ? 0 : page * PAGE_SIZE + 1}
            last={Math.min((page + 1) * PAGE_SIZE, count)}
            count={count}
            busy={isFetching}
            onPage={setPage}
          />
        </div>
      )}

      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
