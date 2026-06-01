interface PaginationProps {
  page: number;
  totalPages: number;
  // params actuales (q, status) para preservarlos al cambiar de página
  params: Record<string, string | undefined>;
}

function buildHref(params: Record<string, string | undefined>, page: number): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  sp.set('page', String(page));
  return `/admin?${sp.toString()}`;
}

export default function Pagination({ page, totalPages, params }: PaginationProps) {
  if (totalPages <= 1) return null;

  const linkStyle = (disabled: boolean) => ({
    pointerEvents: disabled ? ('none' as const) : ('auto' as const),
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <nav
      aria-label="Paginación"
      style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 }}
    >
      <a
        href={buildHref(params, page - 1)}
        aria-disabled={page <= 1}
        className="term-btn term-btn--outline"
        style={linkStyle(page <= 1)}
      >
        ‹
      </a>
      <span className="term-label" style={{ margin: 0 }} aria-current="page">
        Pág {page} // {totalPages}
      </span>
      <a
        href={buildHref(params, page + 1)}
        aria-disabled={page >= totalPages}
        className="term-btn term-btn--outline"
        style={linkStyle(page >= totalPages)}
      >
        ›
      </a>
    </nav>
  );
}
