const styles = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  neutral:
    "border-gray-200 bg-gray-50 text-gray-600 dark:border-dark-border dark:bg-dark-elevated dark:text-gray-400",
  brand:
    "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400",
};

export type BadgeVariant = keyof typeof styles;

/** The main app's badge, in its win/draw/loss colours. */
export function Badge({ label, variant, title }: { label: string; variant: BadgeVariant; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {label}
    </span>
  );
}
