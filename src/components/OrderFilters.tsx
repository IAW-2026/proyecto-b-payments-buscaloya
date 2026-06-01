import type { OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['payment_pending', 'paid', 'failed', 'cancelled', 'closed'];

// Formulario de búsqueda/filtro. Usa method=GET → los filtros quedan en la URL (req. Etapa 2).
export default function OrderFilters({ q, status }: { q?: string; status?: string }) {
  return (
    <form
      method="get"
      role="search"
      style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}
    >
      <div className="term-field">
        <label htmlFor="q">Buscar (order_id o buyer_id)</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="uuid o user_..."
          className="term-input"
          style={{ minWidth: 240 }}
        />
      </div>

      <div className="term-field">
        <label htmlFor="status">Estado</label>
        <select id="status" name="status" defaultValue={status ?? ''} className="term-select">
          <option value="">Todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="term-btn">
        Filtrar
      </button>
      <a href="/admin" className="term-btn term-btn--outline">
        Limpiar
      </a>
    </form>
  );
}
