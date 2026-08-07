"use client";

import { useState } from "react";

import { Modal } from "@/components/Modal";
import { SpinnerIcon } from "@/components/icons";
import { useDeleteUserMutation, type AdminUser } from "@/redux/api/adminApi";

/**
 * Permanent deletion, gated behind typing the username.
 *
 * The confirmation isn't decoration: deleting a user CASCADEs to their players,
 * prep sessions, repertoire and tournaments, none of which can be recovered.
 * The same username is re-checked server-side, so a stale row in the table
 * can't cause the wrong account to be destroyed.
 */
export function DeleteUserDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const [deleteUser, { isLoading, error }] = useDeleteUserMutation();

  const matches = typed === user.username;

  const message =
    error && Array.isArray(error) && error[0]?.message
      ? error[0].message
      : error
        ? "Couldn't delete this user."
        : null;

  const onConfirm = async () => {
    if (!matches) return;
    try {
      await deleteUser({ id: user.id, expectedUsername: user.username }).unwrap();
      onClose();
    } catch {
      // Surfaced below; the dialog stays open.
    }
  };

  return (
    <Modal title={`Delete ${user.username}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-gray-700">
          This permanently deletes <strong>{user.username}</strong> ({user.email}) and everything
          they own — including{" "}
          <strong>
            {user.playersCount} player{user.playersCount === 1 ? "" : "s"}
          </strong>
          , their prep sessions, repertoire and tournaments.
        </p>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          This cannot be undone. To suspend access instead while keeping their data, cancel and use
          Deactivate.
        </p>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">
            Type <code className="rounded bg-gray-100 px-1 py-0.5">{user.username}</code> to confirm
          </span>
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </label>

        {message && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {message}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches || isLoading}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
            Delete permanently
          </button>
        </div>
      </div>
    </Modal>
  );
}
