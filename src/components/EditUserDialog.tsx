"use client";

import { useState } from "react";

import { Modal } from "@/components/Modal";
import { SpinnerIcon } from "@/components/icons";
import {
  useUpdateUserMutation,
  type AdminUser,
  type UpdateUserPatch,
} from "@/redux/api/adminApi";

export function EditUserDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [isActive, setIsActive] = useState(user.isActive);

  const [updateUser, { isLoading, error }] = useUpdateUserMutation();

  // Send only what actually changed. Untouched fields are omitted entirely, so
  // the server leaves them alone rather than rewriting them with values read
  // when this form opened.
  const patch: UpdateUserPatch = { id: user.id };
  if (firstName !== user.firstName) patch.firstName = firstName;
  if (lastName !== user.lastName) patch.lastName = lastName;
  if (email !== user.email) patch.email = email;
  if (username !== user.username) patch.username = username;
  if (isActive !== user.isActive) patch.isActive = isActive;

  const dirty = Object.keys(patch).length > 1;

  const message =
    error && Array.isArray(error) && error[0]?.message
      ? error[0].message
      : error
        ? "Couldn't save changes."
        : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    try {
      await updateUser(patch).unwrap();
      onClose();
    } catch {
      // Error surfaces via the `error` binding above; keep the dialog open so
      // the admin can correct the input instead of losing what they typed.
    }
  };

  return (
    <Modal title={`Edit ${user.username}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="field-label">First name</span>
            <input className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Last name</span>
            <input className="field" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="field-label">Email</span>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="field-label">Username</span>
          <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>

        <label className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            className="mt-0.5 accent-brand-600"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Email verified</span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              Unverified accounts can&apos;t log in. Tick this to let someone in whose
              verification email never arrived.
            </span>
          </span>
        </label>

        {message && (
          <p className="banner-danger">{message}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!dirty || isLoading}
            className="btn-primary"
          >
            {isLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
