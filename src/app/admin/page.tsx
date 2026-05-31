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
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Órdenes</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
        {total} órdenes en total · Ingresos confirmados (paid + closed): <strong>${paidRevenue.toFixed(2)}</strong>
      </p>

      {/* Reporte por estado */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {(['payment_pending', 'paid', 'failed', 'cancelled', 'closed'] as OrderStatus[]).map((s) => (
          <div
            key={s}
            style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', minWidth: 140 }}
          >
            <StatusBadge status={s} />
            <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700 }}>{report[s]?.count ?? 0}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>${(report[s]?.amount ?? 0).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <OrderFilters q={q} status={status} />

      {error && (
        <p style={{ color: '#b91c1c' }}>Error al cargar órdenes: {error.message}</p>
      )}

      {orders.length === 0 ? (
        <p style={{ color: '#666' }}>No se encontraron órdenes con esos filtros.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <caption style={{ textAlign: 'left', color: '#888', fontSize: 12, marginBottom: 8 }}>
            Listado de órdenes financieras
          </caption>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '8px 6px' }}>Order ID</th>
              <th style={{ padding: '8px 6px' }}>Buyer</th>
              <th style={{ padding: '8px 6px' }}>Estado</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '8px 6px' }}>Creada</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px 6px' }}>
                  <Link href={`/admin/orders/${o.order_id}`} style={{ color: '#1d4ed8', fontFamily: 'monospace' }}>
                    {o.order_id.slice(0, 8)}…
                  </Link>
                </td>
                <td style={{ padding: '8px 6px', fontFamily: 'monospace', color: '#555' }}>{o.buyer_id}</td>
                <td style={{ padding: '8px 6px' }}>
                  <StatusBadge status={o.status} />
                </td>
                <td style={{ padding: '8px 6px', textAlign: 'right' }}>${Number(o.total_amount).toFixed(2)}</td>
                <td style={{ padding: '8px 6px', color: '#888' }}>
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
