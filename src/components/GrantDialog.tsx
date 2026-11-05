"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import { SpinnerIcon } from "@/components/icons";
import { errorMessage, formatAmount, formatDate } from "@/lib/format";
import {
  useGetPlansQuery,
  useGrantAccessMutation,
  type AdminUser,
  type GrantInput,
} from "@/redux/api/adminApi";

type Mode = "payment" | "free";

/**
 * Record a payment made outside Paystack (an M-Pesa send, cash), or give free
 * time. The backend holds the rules (subscriptions/services.py); this form only
 * fills in sensible defaults from the chosen plan and the user's agreed price.
 */
export function GrantDialog({ user, mode, onClose }: { user: AdminUser; mode: Mode; onClose: () => void }) {
  const sub = user.subscription;
  const { data: plans = [] } = useGetPlansQuery();
  // The user's own price group first, when they have one.
  const choices = useMemo(
    () => [...plans].sort((a, b) => Number(b.priceGroup === sub.priceGroup) - Number(a.priceGroup === sub.priceGroup)),
    [plans, sub.priceGroup],
  );

  const [planCode, setPlanCode] = useState("");
  const [days, setDays] = useState("30");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(sub.customCurrency || "KES");
  const [source, setSource] = useState<GrantInput["source"]>(mode === "payment" ? "manual_payment" : "complimentary");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [grantAccess, { isLoading, error }] = useGrantAccessMutation();

  const pickPlan = (code: string) => {
    setPlanCode(code);
    const plan = plans.find((p) => p.code === code);
    if (!plan) return;
    setDays(String(plan.days));
    setCurrency(plan.currency);
    // An agreed price for this user wins over the list price.
    const agreed = sub.customPrice && sub.customCurrency === plan.currency ? sub.customPrice : null;
    if (mode === "payment") setAmount(agreed ?? plan.price);
  };

  const dayCount = Number(days);
  const startsFrom = sub.paidUntil && new Date(sub.paidUntil) > new Date() ? new Date(sub.paidUntil) : new Date();
  const runsUntil = Number.isInteger(dayCount) && dayCount > 0 ? new Date(startsFrom.getTime() + dayCount * 86_400_000) : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await grantAccess({
        userId: user.id,
        source,
        days: dayCount,
        amount: mode === "payment" ? amount : "0",
        currency,
        planCode: planCode || null,
        reference: mode === "payment" ? reference : "",
        note,
      }).unwrap();
      onClose();
    } catch {
      // Shown below from `error`; the form stays open with what was typed.
    }
  };

  return (
    <Modal title={mode === "payment" ? `Record a payment from ${user.username}` : `Give ${user.username} free time`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="field-label">Plan</span>
          <select className="field" value={planCode} onChange={(e) => pickPlan(e.target.value)}>
            <option value="">No plan (enter the days yourself)</option>
            {choices.map((p) => (
              <option key={p.code} value={p.code}>
                {p.priceGroup} · {p.name} · {formatAmount(p.price, p.currency)}
                {p.isOnSale ? "" : " (not on sale)"}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="field-label">Days</span>
            <input className="field" type="number" min={1} max={3660} required value={days} onChange={(e) => setDays(e.target.value)} />
          </label>
          {mode === "payment" ? (
            <label className="block">
              <span className="field-label">Amount paid</span>
              <div className="flex gap-2">
                <select className="field w-24" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
                  <option>KES</option>
                  <option>USD</option>
                </select>
                <input className="field" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="350" />
              </div>
            </label>
          ) : (
            <label className="block">
              <span className="field-label">Kind</span>
              <select className="field" value={source} onChange={(e) => setSource(e.target.value as GrantInput["source"])}>
                <option value="complimentary">Complimentary</option>
                <option value="trial">Trial</option>
              </select>
            </label>
          )}
        </div>

        {mode === "payment" && (
          <label className="block">
            <span className="field-label">M-Pesa code or receipt number</span>
            <input className="field font-mono uppercase" required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="SK12ABC3DE" />
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              A code that is already recorded is refused, so the same payment can&apos;t be counted twice.
            </span>
          </label>
        )}

        <label className="block">
          <span className="field-label">Note (optional)</span>
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300}
            placeholder={mode === "payment" ? "Paid to the founder's phone" : "Prize for the Nairobi Open"} />
        </label>

        {runsUntil && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-dark-elevated dark:text-gray-300">
            Access will run until <strong>{formatDate(runsUntil.toISOString(), false)}</strong>
            {sub.paidUntil && new Date(sub.paidUntil) > new Date() ? ", after the time they already have." : "."}
          </p>
        )}

        {error && <p className="banner-danger">{errorMessage(error, "Couldn't save this.")}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
            {mode === "payment" ? "Record payment" : "Give free time"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
