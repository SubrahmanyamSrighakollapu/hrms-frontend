"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";

export interface TablePaginationProps {
  /** Current 1-based page. */
  page: number;
  /** Rows per page. */
  pageSize: number;
  /** Total number of rows across all pages. */
  total: number;
  /** Optional override — defaults to `ceil(total / pageSize)`. */
  totalPages?: number;
  onPageChange: (page: number) => void;
  /** When provided, a "rows per page" selector is rendered. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
  /** Plural noun for the summary, e.g. "employees". */
  label?: string;
  className?: string;
}

/** Builds the page-number strip: 1 … 4 5 6 … 20 */
function pageWindow(current: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push("gap");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages - 1) pages.push("gap");
  pages.push(totalPages);
  return pages;
}

/**
 * Reusable table footer: result summary, page-size selector and page navigation.
 * Works with both server-paginated lists (pass the API's `page` meta) and
 * client-paginated lists (pair it with `useClientPagination`).
 */
export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  loading = false,
  label = "results",
  className = "",
}: TablePaginationProps) {
  const pages = Math.max(1, totalPages ?? (Math.ceil(total / pageSize) || 1));
  const current = Math.min(Math.max(1, page), pages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  const window = useMemo(() => pageWindow(current, pages), [current, pages]);

  const navButton =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--slate-100)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)] ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {total === 0
            ? `No ${label}`
            : `Showing ${from}–${to} of ${total} ${label}`}
        </span>
        {onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5">
            <span className="text-xs">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={loading}
              className="input-base w-auto py-1 text-xs"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1 || loading}
          className={navButton}
          aria-label="Previous page"
        >
          <Icon name="ChevronLeft" size={15} />
        </button>

        {pages <= 1 ? (
          <span className="px-2 text-xs">
            Page {current} of {pages}
          </span>
        ) : (
          window.map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-xs">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                disabled={loading}
                aria-current={item === current ? "page" : undefined}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${
                  item === current
                    ? "bg-[var(--brand-600)] text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--slate-100)] hover:text-[var(--text)]"
                }`}
              >
                {item}
              </button>
            ),
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= pages || loading}
          className={navButton}
          aria-label="Next page"
        >
          <Icon name="ChevronRight" size={15} />
        </button>
      </div>
    </div>
  );
}

/**
 * Client-side pagination for lists already held in memory. Slice the returned
 * `pageItems` in render and feed the rest of the fields to `TablePagination`.
 * The page is clamped automatically when the underlying list shrinks.
 */
export function useClientPagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  );

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return { page: current, pageSize, total, totalPages, pageItems, setPage, setPageSize };
}
