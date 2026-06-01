import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import PaymentBrick from './PaymentBrick';

interface PageProps {
  params: Promise<{ order_id: string }>;
  searchParams: Promise<{ status?: string }>;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  paid: { text: '¡Pago aprobado! Tu pedido está confirmado.', color: '#16a34a' },
  failed: { text: 'El pago fue rechazado. Para reintentar, generá una nueva orden desde la app de compras.', color: '#dc2626' },
  payment_pending: { text: 'El pago está en proceso.', color: '#d97706' },
};

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { order_id } = await params;
  const { status: statusParam } = await searchParams;

  const { data: order } = await supabase
    .from('orders')
    .select('order_id, status, total_amount, delivery_cost, mp_preference_id, items_snapshot, buyer_id')
    .eq('order_id', order_id)
    .single();

  if (!order) notFound();

  // Verificar que el comprador autenticado es el dueño de la orden
  if (order.buyer_id !== userId) notFound();

  const feedback = statusParam ? STATUS_LABELS[statusParam] : null;
  const isPaid = order.status === 'paid' || order.status === 'failed';

  return (
    <main style={{ maxWidth: 520, margin: '48px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Resumen de tu pedido</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        Orden <code>{order.order_id}</code>
      </p>

      <ul style={{ padding: 0, listStyle: 'none', margin: '0 0 24px' }}>
        {order.items_snapshot.map((item: { product_id: string; name: string; unit_price: number; quantity: number }) => (
          <li
            key={item.product_id}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}
          >
            <span>{item.name} x{item.quantity}</span>
            <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#666' }}>
          <span>Envío</span>
          <span>${order.delivery_cost.toFixed(2)}</span>
        </li>
        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold', fontSize: 16 }}>
          <span>Total</span>
          <span>${order.total_amount.toFixed(2)}</span>
        </li>
      </ul>

      {feedback && (
        <p style={{ color: feedback.color, padding: '12px', border: `1px solid ${feedback.color}`, borderRadius: 6, marginBottom: 24 }}>
          {feedback.text}
        </p>
      )}

      {!isPaid && order.mp_preference_id && (
        <PaymentBrick
          preferenceId={order.mp_preference_id}
          totalAmount={order.total_amount}
          orderId={order.order_id}
        />
      )}

      {isPaid && (
        <p style={{ color: STATUS_LABELS[order.status]?.color ?? '#666', fontWeight: 'bold' }}>
          {STATUS_LABELS[order.status]?.text}
        </p>
      )}
    </main>
  );
}
