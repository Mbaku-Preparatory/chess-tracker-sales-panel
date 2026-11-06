"use client";

import { useState } from "react";

import { Modal } from "@/components/Modal";
import { SpinnerIcon } from "@/components/icons";
import { errorMessage, PRICE_GROUPS } from "@/lib/format";
import { useSetSubscriptionTermsMutation, type AdminUser, type TermsInput } from "@/redux/api/adminApi";

/** "2026-11-20" from an ISO date-time, in the browser's own time zone. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The end of that day, local time: "pay by the 20th" includes the 20th. */
function endOfDay(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString();
}

/**
 * Per-user terms, as Bomahut's sales panel has them: a negotiated monthly and
 * annual price, a date they have agreed to pay by, and the rest (founding
 * member, price group, a note). Only what changed is sent.
 */
export function TermsDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const sub = user.subscription;
  const [monthly, setMonthly] = useState(sub.negotiatedMonthly ?? "");
  const [annual, setAnnual] = useState(sub.negotiatedAnnual ?? "");
  const [currency, setCurrency] = useState(sub.negotiatedCurrency || (sub.priceGroup === "EA" || !sub.priceGroup ? "KES" : "USD"));
  const [payBy, setPayBy] = useState(toDateInput(sub.negotiatedUntil));
  const [foundingMember, setFoundingMember] = useState(sub.foundingMember);
  const [priceGroup, setPriceGroup] = useState(sub.priceGroup);
  const [termsNote, setTermsNote] = useState(sub.termsNote);
  const [save, { isLoading, error }] = useSetSubscriptionTermsMutation();

  const input: TermsInput = { userId: user.id };
  const price = (typed: string, current: string | null, set: (v: string) => void, clear: () => void) => {
    if (typed.trim() === "" && current !== null) clear();
    else if (typed.trim() !== "" && Number(typed) !== Number(current)) set(typed.trim());
  };
  price(monthly, sub.negotiatedMonthly, (v) => (input.negotiatedMonthly = v), () => (input.clearNegotiatedMonthly = true));
  price(annual, sub.negotiatedAnnual, (v) => (input.negotiatedAnnual = v), () => (input.clearNegotiatedAnnual = true));
  const anyPrice = monthly.trim() !== "" || annual.trim() !== "";
  if (anyPrice && currency !== sub.negotiatedCurrency) input.negotiatedCurrency = currency;
  if (payBy === "" && sub.negotiatedUntil) input.clearNegotiatedUntil = true;
  if (payBy !== "" && payBy !== toDateInput(sub.negotiatedUntil)) input.negotiatedUntil = endOfDay(payBy);
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
        <fieldset className="space-y-2">
          <legend className="field-label">Negotiated price (optional)</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-[6rem_1fr_1fr]">
            <label className="col-span-2 block sm:col-span-1">
              <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Currency</span>
              <select className="field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>KES</option>
                <option>USD</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Monthly</span>
              <input className="field" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)}
                placeholder="Plan price" aria-label="Negotiated monthly price" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Annual</span>
              <input className="field" inputMode="decimal" value={annual} onChange={(e) => setAnnual(e.target.value)}
                placeholder="Plan price" aria-label="Negotiated annual price" />
            </label>
          </div>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            For a club, a school or a founding member. Replaces the plan&apos;s price when they pay in the app, and
            fills in the amount when you record a payment. Leave a box empty for the plan&apos;s price.
          </span>
        </fieldset>

        <label className="block">
          <span className="field-label">Pay-by date (optional)</span>
          <div className="flex gap-2">
            <input type="date" className="field" value={payBy} min={toDateInput(new Date().toISOString())}
              onChange={(e) => setPayBy(e.target.value)} />
            {payBy && <button type="button" className="btn-secondary" onClick={() => setPayBy("")}>Clear</button>}
          </div>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            They keep access until the end of this day whether or not they have paid, and get no reminder before it.
            Up to a year ahead; for longer, give free time instead.
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
