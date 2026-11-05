"use client";

import { useState } from "react";

import { Modal } from "@/components/Modal";
import { SpinnerIcon } from "@/components/icons";
import { errorMessage, formatAmount } from "@/lib/format";
import { useVoidGrantMutation, type Grant } from "@/redux/api/adminApi";

/** Take a grant back. It stays in the ledger, struck through, with the reason. */
export function VoidGrantDialog({ grant, onClose }: { grant: Grant; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [voidGrant, { isLoading, error }] = useVoidGrantMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await voidGrant({ grantId: grant.id, reason }).unwrap();
      onClose();
    } catch {
      // Shown below.
    }
  };

  return (
    <Modal title="Void this grant" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {grant.sourceLabel}: {grant.days} days
          {Number(grant.amount) > 0 && <>, {formatAmount(grant.amount, grant.currency)}</>}
          {grant.reference && <> ({grant.reference})</>}. Its days come off, and any later grants move up. It stays in
          the ledger, marked void.
        </p>
        <label className="block">
          <span className="field-label">Why?</span>
          <input className="field" required autoFocus value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300}
            placeholder="Recorded on the wrong account" />
        </label>
        {error && <p className="banner-danger">{errorMessage(error, "Couldn't void this.")}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isLoading || !reason.trim()} className="btn-danger">
            {isLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
            Void grant
          </button>
        </div>
      </form>
    </Modal>
  );
}
