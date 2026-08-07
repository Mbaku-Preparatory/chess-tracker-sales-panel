"use client";

import { selectIsFetching } from "@/redux/api/adminApi";
import { useAppSelector } from "@/redux/hooks";

/**
 * Indeterminate progress bar shown while any request is in flight.
 *
 * Reads RTK Query's own request state rather than tracking requests itself, so
 * it covers every query and mutation automatically — including ones added
 * later, with no registration step.
 */
export function GlobalLoader() {
  const active = useAppSelector(selectIsFetching);

  if (!active) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-busy="true"
      className="fixed left-0 top-0 z-50 h-[3px] w-full overflow-hidden bg-transparent"
    >
      <div className="h-full w-full animate-[global-loader_1.2s_ease-in-out_infinite] bg-brand-500" />
    </div>
  );
}
