import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import OrderFilters from '@/components/OrderFilters';
import Pagination from '@/components/Pagination';
import type { OrderStatus } from '@/types';

const PAGE_SIZE = 10;

interface AdminPageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

interface OrderRow {
  order_id: string;
  buyer_id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_cost: number;
  created_at: string;
}

// Reporte: totales y monto acumulado por estado (req. Etapa 2: listado + reporte relevante)
async function getReport() {
  const { data } = await supabase.from('orders').select('status, total_amount');
  const report: Record<string, { count: number; amount: number }> = {};
  let paidRevenue = 0;
  for (const row of data ?? []) {
    const s = row.status as string;
    report[s] = report[s] ?? { count: 0, amount: 0 };
    report[s].count += 1;
    report[s].amount += Number(row.total_amount) || 0;
    if (s === 'paid' || s === 'closed') paidRevenue += Number(row.total_amount) || 0;
  }
  return { report, paidRevenue, total: data?.length ?? 0 };
}

export default async function AdminOrdersPage({ searchParams }: AdminPageProps) {
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('orders')
    .select('order_id, buyer_id, status, total_amount, delivery_cost, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (q) query = query.or(`order_id.ilike.%${q}%,buyer_id.ilike.%${q}%`);

  const { data, count, error } = await query;
  const orders = (data ?? []) as OrderRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const { report, paidRevenue, total } = await getReport();

  return (
    <section>
      <p className="term-label">Telemetría financiera</p>
      <h1 className="term-h term-h--lg" style={{ marginBottom: 8 }}>Órdenes</h1>
      <p className="term-muted" style={{ marginBottom: 24 }}>
        {total} órdenes en total · Ingresos confirmados (paid + closed):{' '}
        <strong style={{ color: 'var(--green)' }}>${paidRevenue.toFixed(2)}</strong>
      </p>

      {/* Reporte por estado */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {(['payment_pending', 'paid', 'failed', 'cancelled', 'closed'] as OrderStatus[]).map((s) => (
          <div key={s} className="term-card" style={{ minWidth: 140, padding: '12px 14px' }}>
            <StatusBadge status={s} />
            <p style={{ margin: '10px 0 0', fontSize: 22, fontWeight: 700, color: '#fff' }}>{report[s]?.count ?? 0}</p>
            <p className="term-muted mono" style={{ margin: 0, fontSize: 12 }}>${(report[s]?.amount ?? 0).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <OrderFilters q={q} status={status} />

      {error && (
        <p className="term-alert" style={{ color: 'var(--red)' }}>Error al cargar órdenes: {error.message}</p>
      )}

      {orders.length === 0 ? (
        <p className="term-muted">No se encontraron órdenes con esos filtros.</p>
      ) : (
        <table className="term-table">
          <caption>Listado de órdenes financieras</caption>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Estado</th>
              <th className="tr">Total</th>
              <th>Creada</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id}>
                <td>
                  <Link href={`/admin/orders/${o.order_id}`} className="mono">
                    {o.order_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="mono term-muted">{o.buyer_id}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="tr mono">${Number(o.total_amount).toFixed(2)}</td>
                <td className="term-muted">
                  {new Date(o.created_at).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination page={page} totalPages={totalPages} params={{ q, status }} />
    </section>
  );
}
