"use client";

import { useState } from "react";

import { Modal } from "@/components/Modal";
import { SpinnerIcon } from "@/components/icons";
import {
  useUpdateUserMutation,
  type AdminUser,
  type UpdateUserPatch,
} from "@/redux/api/adminApi";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 " +
  "focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

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
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">First name</span>
            <input className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Last name</span>
            <input className={field} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Email</span>
          <input
            className={field}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Username</span>
          <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>

        <label className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="text-xs text-gray-700">
            <span className="font-medium">Email verified</span>
            <span className="mt-0.5 block text-gray-500">
              Unverified accounts can&apos;t log in. Tick this to let someone in whose
              verification email never arrived.
            </span>
          </span>
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
            type="submit"
            disabled={!dirty || isLoading}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
