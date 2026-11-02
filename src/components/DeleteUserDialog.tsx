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
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          This permanently deletes <strong>{user.username}</strong> ({user.email}) and everything
          they own — including{" "}
          <strong>
            {user.playersCount} player{user.playersCount === 1 ? "" : "s"}
          </strong>
          , their prep sessions, repertoire and tournaments.
        </p>
        <p className="banner-danger">
          This cannot be undone. To suspend access instead while keeping their data, cancel and use
          Deactivate.
        </p>

        <label className="block">
          <span className="field-label">
            Type{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 font-semibold dark:bg-dark-muted">
              {user.username}
            </code>{" "}
            to confirm
          </span>
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="field focus:border-red-500 focus:ring-red-500"
          />
        </label>

        {message && (
          <p className="banner-danger">{message}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches || isLoading}
            className="btn-danger"
          >
            {isLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
            Delete permanently
          </button>
        </div>
      </div>
    </Modal>
  );
}
