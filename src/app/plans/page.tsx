"use client";

import { useState } from "react";

import { Badge } from "@/components/Badge";
import { SpinnerIcon } from "@/components/icons";
import { errorMessage, PRICE_GROUPS } from "@/lib/format";
import { useGetPlansQuery, useUpdatePlanMutation, type Plan } from "@/redux/api/adminApi";

function PlanRow({ plan }: { plan: Plan }) {
  const [price, setPrice] = useState(plan.price);
  const [update, { isLoading, error }] = useUpdatePlanMutation();
  const priceChanged = price.trim() !== plan.price;

  return (
    <tr className="bg-white dark:bg-dark-surface">
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
        {plan.name}
        <span className="block font-mono text-xs font-normal text-gray-400">{plan.code}</span>
      </td>
      <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-300">{plan.days}</td>
      <td className="px-4 py-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (priceChanged) update({ code: plan.code, price: price.trim() });
          }}
        >
          <span className="text-xs text-gray-500 dark:text-gray-400">{plan.currency}</span>
          <input className="field w-28 py-1.5" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} aria-label={`Price of ${plan.code}`} />
          {priceChanged && (
            <button type="submit" disabled={isLoading} className="btn-primary px-3 py-1.5 text-xs">
              {isLoading && <SpinnerIcon className="h-3 w-3" />}
              Save
            </button>
          )}
        </form>
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errorMessage(error, "Couldn't save.")}</p>}
      </td>
      <td className="px-4 py-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-brand-600"
            checked={plan.isOnSale}
            disabled={isLoading}
            onChange={(e) => update({ code: plan.code, isOnSale: e.target.checked })}
          />
          {plan.isOnSale ? <Badge label="On sale" variant="success" /> : <Badge label="Off sale" variant="neutral" />}
        </label>
      </td>
    </tr>
  );
}

export default function PlansPage() {
  const { data: plans, isLoading, isError } = useGetPlansQuery();
  const groups = Object.keys(PRICE_GROUPS);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Plans</h1>
        <p className="mt-1.5 max-w-2xl text-base text-gray-500 dark:text-gray-400">
          What each price group pays. A new price applies to the next sale only: payments already made keep
          their amount. Nothing is sold in the app yet, so &ldquo;on sale&rdquo; only matters once checkout exists.
        </p>
      </div>
      {isLoading && <div className="card p-6 text-sm text-gray-500">Loading plans…</div>}
      {isError && <div className="banner-danger">Couldn&apos;t load plans.</div>}
      <div className="space-y-6">
        {plans &&
          groups.map((group) => (
            <section key={group}>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{PRICE_GROUPS[group]}</h2>
              <div className="card relative overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs tracking-[0.06em] text-gray-500 uppercase dark:border-dark-border dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Days</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">On sale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                    {plans.filter((p) => p.priceGroup === group).map((p) => <PlanRow key={`${p.code}:${p.price}`} plan={p} />)}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
