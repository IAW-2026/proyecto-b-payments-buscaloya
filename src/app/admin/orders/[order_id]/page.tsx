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
      <Link href="/admin" style={{ color: '#1d4ed8', fontSize: 14 }}>
        ← Volver al listado
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 4px' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Orden</h1>
        <StatusBadge status={order.status as OrderStatus} />
      </div>
      <p style={{ fontFamily: 'monospace', color: '#666', fontSize: 13 }}>{order.order_id}</p>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 14, margin: '16px 0 24px' }}>
        <dt style={{ color: '#888' }}>Buyer</dt>
        <dd style={{ margin: 0, fontFamily: 'monospace' }}>{order.buyer_id}</dd>
        <dt style={{ color: '#888' }}>Store</dt>
        <dd style={{ margin: 0, fontFamily: 'monospace' }}>{order.store_id}</dd>
        <dt style={{ color: '#888' }}>Total</dt>
        <dd style={{ margin: 0, fontWeight: 700 }}>${Number(order.total_amount).toFixed(2)}</dd>
        <dt style={{ color: '#888' }}>Envío</dt>
        <dd style={{ margin: 0 }}>${Number(order.delivery_cost).toFixed(2)}</dd>
        <dt style={{ color: '#888' }}>MP preference</dt>
        <dd style={{ margin: 0, fontFamily: 'monospace' }}>{order.mp_preference_id ?? '—'}</dd>
        <dt style={{ color: '#888' }}>MP payment</dt>
        <dd style={{ margin: 0, fontFamily: 'monospace' }}>{order.mp_payment_id ?? '—'}</dd>
        <dt style={{ color: '#888' }}>Creada</dt>
        <dd style={{ margin: 0 }}>{new Date(order.created_at).toLocaleString('es-AR')}</dd>
      </dl>

      <h2 style={{ fontSize: 16 }}>Ítems</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 24 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th style={{ padding: '6px 4px' }}>Producto</th>
            <th style={{ padding: '6px 4px' }}>Seller</th>
            <th style={{ padding: '6px 4px', textAlign: 'right' }}>Cant.</th>
            <th style={{ padding: '6px 4px', textAlign: 'right' }}>Unitario</th>
            <th style={{ padding: '6px 4px', textAlign: 'right' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={`${it.product_id}-${i}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '6px 4px' }}>{it.name}</td>
              <td style={{ padding: '6px 4px', fontFamily: 'monospace', color: '#666' }}>{it.seller_id}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{it.quantity}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>${Number(it.unit_price).toFixed(2)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                ${(Number(it.unit_price) * it.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 16 }}>Entrega (snapshot)</h2>
      <p style={{ fontSize: 14, color: '#444' }}>
        {addr.street}, {addr.city} {addr.zip ? `(${addr.zip})` : ''}
        <br />
        Cotización: {quote.quote_id ?? '—'} · ${Number(quote.cost ?? 0).toFixed(2)} ·{' '}
        {quote.estimated_minutes ?? '—'} min
      </p>

      <div style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Gestionar orden</h2>
        <StatusForm orderId={order.order_id} currentStatus={order.status as OrderStatus} />
      </div>
    </section>
  );
}
