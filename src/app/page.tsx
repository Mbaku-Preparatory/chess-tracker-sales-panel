"use client";

import { useGetUsersQuery } from "@/redux/api/adminApi";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function UsersPage() {
  const { data: users, isLoading, isError, error, refetch } = useGetUsersQuery();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users ? `${users.length} account${users.length === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading users…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn&apos;t load users: {JSON.stringify(error)}
        </div>
      )}

      {users && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Username</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Email</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Players</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Joined</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2.5 text-gray-900">
                    {user.firstName || user.lastName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{user.username}</td>
                  <td className="px-4 py-2.5 text-gray-700">{user.email}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {user.isActive ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{user.playersCount}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(user.dateJoined)}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(user.lastLogin)}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
