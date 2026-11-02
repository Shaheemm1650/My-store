import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const prev = page > 1 ? makeHref(page - 1) : null;
  const next = page < totalPages ? makeHref(page + 1) : null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
      {prev ? (
        <Link href={prev} className="btn-secondary" rel="prev">
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-40">
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </span>
      )}
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      {next ? (
        <Link href={next} className="btn-secondary" rel="next">
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-40">
          Next <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
