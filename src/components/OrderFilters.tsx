import type { OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['payment_pending', 'paid', 'failed', 'cancelled', 'closed'];

// Formulario de búsqueda/filtro. Usa method=GET → los filtros quedan en la URL (req. Etapa 2).
export default function OrderFilters({ q, status }: { q?: string; status?: string }) {
  return (
    <form
      method="get"
      role="search"
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="q" style={{ fontSize: 12, color: '#555' }}>
          Buscar (order_id o buyer_id)
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="uuid o user_..."
          style={{ padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, minWidth: 240 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="status" style={{ fontSize: 12, color: '#555' }}>
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status ?? ''}
          style={{ padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6 }}
        >
          <option value="">Todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        style={{ padding: '9px 16px', background: '#111', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}
      >
        Filtrar
      </button>
      <a href="/admin" style={{ padding: '9px 12px', color: '#555', fontSize: 14 }}>
        Limpiar
      </a>
    </form>
  );
}
