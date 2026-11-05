"use client";

import { useState } from "react";

import { Modal } from "@/components/Modal";
import { SpinnerIcon } from "@/components/icons";
import { errorMessage, PRICE_GROUPS } from "@/lib/format";
import { useSetSubscriptionTermsMutation, type AdminUser, type TermsInput } from "@/redux/api/adminApi";

/** Per-user terms: an agreed price, founding member, price group, a note. */
export function TermsDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const sub = user.subscription;
  const [customPrice, setCustomPrice] = useState(sub.customPrice ?? "");
  const [customCurrency, setCustomCurrency] = useState(sub.customCurrency || "KES");
  const [foundingMember, setFoundingMember] = useState(sub.foundingMember);
  const [priceGroup, setPriceGroup] = useState(sub.priceGroup);
  const [termsNote, setTermsNote] = useState(sub.termsNote);
  const [save, { isLoading, error }] = useSetSubscriptionTermsMutation();

  // Only what changed is sent, like the user editor.
  const input: TermsInput = { userId: user.id };
  if (customPrice.trim() === "" && sub.customPrice !== null) input.clearCustomPrice = true;
  if (customPrice.trim() !== "" && (customPrice !== sub.customPrice || customCurrency !== sub.customCurrency)) {
    input.customPrice = customPrice.trim();
    input.customCurrency = customCurrency;
  }
  if (foundingMember !== sub.foundingMember) input.foundingMember = foundingMember;
  if (priceGroup !== sub.priceGroup) input.priceGroup = priceGroup;
  if (termsNote !== sub.termsNote) input.termsNote = termsNote;
  const dirty = Object.keys(input).length > 1;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    try {
      await save(input).unwrap();
      onClose();
    } catch {
      // Shown below.
    }
  };

  return (
    <Modal title={`Terms for ${user.username}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="field-label">Agreed price (optional)</span>
          <div className="flex gap-2">
            <select className="field w-24" value={customCurrency} onChange={(e) => setCustomCurrency(e.target.value)} aria-label="Currency">
              <option>KES</option>
              <option>USD</option>
            </select>
            <input className="field" inputMode="decimal" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="Leave empty for the plan's price" />
          </div>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            For a club, a school or a founding member. Fills in the amount when you record their payments.
          </span>
        </label>

        <label className="block">
          <span className="field-label">Price group</span>
          <select className="field" value={priceGroup} onChange={(e) => setPriceGroup(e.target.value)}>
            <option value="">Not set yet (set by their first payment)</option>
            {Object.entries(PRICE_GROUPS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </label>

        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-0.5 accent-brand-600" checked={foundingMember} onChange={(e) => setFoundingMember(e.target.checked)} />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Founding member</span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">One of the first subscribers, who keeps their price for life.</span>
          </span>
        </label>

        <label className="block">
          <span className="field-label">Note</span>
          <input className="field" value={termsNote} onChange={(e) => setTermsNote(e.target.value)} maxLength={300}
            placeholder="Agreed with the club treasurer, 12 Nov" />
        </label>

        {error && <p className="banner-danger">{errorMessage(error, "Couldn't save the terms.")}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={!dirty || isLoading} className="btn-primary">
            {isLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
            Save terms
          </button>
        </div>
      </form>
    </Modal>
  );
}
