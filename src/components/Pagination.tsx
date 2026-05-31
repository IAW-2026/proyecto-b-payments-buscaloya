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
    padding: '6px 12px',
    border: '1px solid #ccc',
    borderRadius: 6,
    color: disabled ? '#bbb' : '#111',
    pointerEvents: disabled ? ('none' as const) : ('auto' as const),
    textDecoration: 'none',
    fontSize: 14,
  });

  return (
    <nav aria-label="Paginación" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 20 }}>
      <a href={buildHref(params, page - 1)} aria-disabled={page <= 1} style={linkStyle(page <= 1)}>
        ← Anterior
      </a>
      <span style={{ fontSize: 14, color: '#555' }} aria-current="page">
        Página {page} de {totalPages}
      </span>
      <a href={buildHref(params, page + 1)} aria-disabled={page >= totalPages} style={linkStyle(page >= totalPages)}>
        Siguiente →
      </a>
    </nav>
  );
}
