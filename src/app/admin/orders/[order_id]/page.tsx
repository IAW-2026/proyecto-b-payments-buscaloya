import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import StatusForm from './StatusForm';
import type { OrderItem, OrderStatus } from '@/types';

interface DetailProps {
  params: Promise<{ order_id: string }>;
}

export default async function OrderDetailPage({ params }: DetailProps) {
  const { order_id } = await params;

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', order_id)
    .single();

  if (error || !order) notFound();

  const items = (order.items_snapshot ?? []) as OrderItem[];
  const addr = order.delivery_address_snapshot ?? {};
  const quote = order.delivery_quote_snapshot ?? {};

  return (
    <section>
      <Link href="/admin" className="term-muted">
        ‹/ Volver al listado
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 4px' }}>
        <h1 className="term-h term-h--lg" style={{ margin: 0 }}>Orden</h1>
        <StatusBadge status={order.status as OrderStatus} />
      </div>
      <p className="mono term-muted" style={{ fontSize: 13 }}>{order.order_id}</p>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14, margin: '20px 0 28px' }}>
        <dt className="term-muted">Buyer</dt>
        <dd style={{ margin: 0 }} className="mono">{order.buyer_id}</dd>
        <dt className="term-muted">Store</dt>
        <dd style={{ margin: 0 }} className="mono">{order.store_id}</dd>
        <dt className="term-muted">Total</dt>
        <dd style={{ margin: 0, fontWeight: 700, color: 'var(--green)' }} className="mono">${Number(order.total_amount).toFixed(2)}</dd>
        <dt className="term-muted">Envío</dt>
        <dd style={{ margin: 0 }} className="mono">${Number(order.delivery_cost).toFixed(2)}</dd>
        <dt className="term-muted">MP preference</dt>
        <dd style={{ margin: 0 }} className="mono">{order.mp_preference_id ?? '—'}</dd>
        <dt className="term-muted">MP payment</dt>
        <dd style={{ margin: 0 }} className="mono">{order.mp_payment_id ?? '—'}</dd>
        <dt className="term-muted">Creada</dt>
        <dd style={{ margin: 0 }}>{new Date(order.created_at).toLocaleString('es-AR')}</dd>
      </dl>

      <p className="term-label">Ítems</p>
      <table className="term-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Seller</th>
            <th className="tr">Cant.</th>
            <th className="tr">Unitario</th>
            <th className="tr">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={`${it.product_id}-${i}`}>
              <td>{it.name}</td>
              <td className="mono term-muted">{it.seller_id}</td>
              <td className="tr">{it.quantity}</td>
              <td className="tr mono">${Number(it.unit_price).toFixed(2)}</td>
              <td className="tr mono">
                ${(Number(it.unit_price) * it.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="term-label">Entrega (snapshot)</p>
      <p style={{ fontSize: 14 }}>
        {addr.street}, {addr.city} {addr.zip ? `(${addr.zip})` : ''}
        <br />
        <span className="term-muted">
          Cotización: {quote.quote_id ?? '—'} · ${Number(quote.cost ?? 0).toFixed(2)} ·{' '}
          {quote.estimated_minutes ?? '—'} min
        </span>
      </p>

      <div className="term-card" style={{ marginTop: 24 }}>
        <p className="term-label" style={{ marginBottom: 16 }}>Gestionar orden</p>
        <StatusForm orderId={order.order_id} currentStatus={order.status as OrderStatus} />
      </div>
    </section>
  );
}
