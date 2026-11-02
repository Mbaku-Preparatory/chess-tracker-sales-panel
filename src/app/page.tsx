"use client";

import { useState } from "react";

import { Badge } from "@/components/Badge";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { BanIcon, PencilIcon, RefreshIcon, TrashIcon, UndoIcon } from "@/components/icons";
import {
  useGetUsersQuery,
  useSetUserDisabledMutation,
  type AdminUser,
} from "@/redux/api/adminApi";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const th = "px-4 py-3 font-medium";

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

export default function UsersPage() {
  const { data: users, isLoading, isError, error, refetch } = useGetUsersQuery();
  const [setUserDisabled, { isLoading: isToggling }] = useSetUserDisabledMutation();

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Users
          </h1>
          <p className="mt-1.5 text-base text-gray-500 dark:text-gray-400">
            {users ? `${users.length} account${users.length === 1 ? "" : "s"}` : "Loading…"}
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
              <tr className="border-b border-gray-200 text-xs tracking-[0.06em] text-gray-500 uppercase dark:border-dark-border dark:text-gray-400">
                <th scope="col" className={th}>Name</th>
                <th scope="col" className={th}>Username</th>
                <th scope="col" className={th}>Email</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}>Players</th>
                <th scope="col" className={th}>Joined</th>
                <th scope="col" className={th}>Last login</th>
                <th scope="col" className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-gray-50 dark:hover:bg-dark-elevated ${
                    user.isDisabled ? "bg-gray-50/60 dark:bg-dark-elevated/40" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {user.firstName || user.lastName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.username}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadges user={user} />
                  </td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums dark:text-gray-300">
                    {user.playersCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {formatDate(user.dateJoined)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-4 py-3">
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
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No users yet.
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
