import type { BadgeVariant } from "@/components/Badge";
import type { FunnelStage, Health, Money, SubscriptionStatus } from "@/redux/api/adminApi";

export function formatDate(value: string | null | undefined, withTime = true): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

/** "KES 1,050 · USD 5.99", or "—" for nothing. */
export function formatMoney(items: Money[]): string {
  if (!items.length) return "—";
  return items.map((m) => formatAmount(m.amount, m.currency)).join(" · ");
}

export function formatAmount(amount: string, currency: string): string {
  const n = Number(amount);
  const digits = Number.isInteger(n) ? 0 : 2;
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: 2 })}`;
}

/** Whole days from now until `value`: negative once it has passed. */
export function daysUntil(value: string | null): number | null {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export const STATUS: Record<SubscriptionStatus, { label: string; variant: BadgeVariant; hint: string }> = {
  active: { label: "Active", variant: "success", hint: "Has access, more than 7 days left" },
  expiring: { label: "Expiring", variant: "warning", hint: "Access ends within 7 days" },
  lapsed: { label: "Lapsed", variant: "danger", hint: "Access ended within the last 30 days" },
  churned: { label: "Churned", variant: "neutral", hint: "Access ended more than 30 days ago" },
  never: { label: "Free", variant: "neutral", hint: "No paid or free time on record (voided grants don't count)" },
};

export const FUNNEL: Record<FunnelStage, string> = {
  signed_up: "Signed up",
  verified: "Verified",
  added_player: "Added a player",
  subscribed: "Subscribed",
  renewed: "Renewed",
};

export const HEALTH: Record<Health["label"], { label: string; variant: BadgeVariant }> = {
  healthy: { label: "Healthy", variant: "success" },
  at_risk: { label: "At risk", variant: "warning" },
  churning: { label: "Churning", variant: "danger" },
};

export const PRICE_GROUPS: Record<string, string> = {
  KE: "Kenya (KES, M-Pesa)",
  A: "Group A (US, UK, EU, Gulf…)",
  B: "Group B (Eastern Europe, Latin America…)",
  C: "Group C (India, Africa, South Asia…)",
};

export const ACTIONS: Record<string, string> = {
  grant_access: "Granted access",
  void_grant: "Voided a grant",
  set_terms: "Changed terms",
  update_plan: "Changed a plan",
  update_user: "Edited a user",
  suspend_user: "Suspended a user",
  restore_user: "Restored a user",
  delete_user: "Deleted a user",
};

/** A GraphQL error list (what adminApi rejects with) as one sentence. */
export function errorMessage(error: unknown, fallback: string): string {
  if (Array.isArray(error) && error[0]?.message) return String(error[0].message);
  return error ? fallback : "";
}
