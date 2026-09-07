// Simple numbered pager. Parent keeps the current page in state and slices
// its own rows; this component only renders controls.

export const PAGE_SIZE = 10;

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

export default function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav className="staff-pagination" aria-label="Pagination">
      <button
        type="button"
        className="staff-page-btn"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
      >
        ‹
      </button>
      {pageWindow(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="staff-page-gap">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`staff-page-btn ${p === page ? "active" : ""}`}
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className="staff-page-btn"
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
      >
        ›
      </button>
    </nav>
  );
}
