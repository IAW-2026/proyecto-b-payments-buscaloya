import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import PaymentBrick from './PaymentBrick';

interface PageProps {
  params: Promise<{ order_id: string }>;
  searchParams: Promise<{ status?: string }>;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  paid: { text: '¡Pago aprobado! Tu pedido está confirmado.', color: '#39ff14' },
  failed: { text: 'El pago fue rechazado. Para reintentar, generá una nueva orden desde la app de compras.', color: '#ff5252' },
  payment_pending: { text: 'El pago está en proceso.', color: '#ff5a00' },
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

  // MercadoPago redirige con ?status=success|failure al completar el pago fuera del Brick
  if (statusParam === 'success' || statusParam === 'failure') {
    redirect(`${process.env.NEXT_PUBLIC_BUYER_APP_URL}/purchase`);
  }

  const feedback = statusParam ? STATUS_LABELS[statusParam] : null;
  const isPaid = order.status === 'paid' || order.status === 'failed';

  return (
    <div>
      {/* Barra superior con logout: permite salir y entrar con otra cuenta desde el checkout */}
      <header className="term-topbar">
        <span className="term-label">Módulo de pagos · BuscaloYA</span>
        {/* UserButton incluye el logout */}
        <UserButton />
      </header>
      <main className="term-shell term-shell--narrow">
      <p className="term-label">Checkout · Pago seguro</p>
      <h1 className="term-h term-h--md" style={{ marginBottom: 8 }}>
        Resumen de tu pedido
      </h1>
      <p className="term-muted mono" style={{ fontSize: 12, marginBottom: 24 }}>
        Orden {order.order_id}
      </p>

      <ul style={{ padding: 0, listStyle: 'none', margin: '0 0 24px' }}>
        {order.items_snapshot.map((item: { product_id: string; name: string; unit_price: number; quantity: number }) => (
          <li key={item.product_id} className="term-row">
            <span>{item.name} x{item.quantity}</span>
            <span className="mono">${(item.unit_price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
        <li className="term-row term-muted">
          <span>Envío</span>
          <span className="mono">${order.delivery_cost.toFixed(2)}</span>
        </li>
        <li className="term-row term-row--total">
          <span>Total</span>
          <span className="mono">${order.total_amount.toFixed(2)}</span>
        </li>
      </ul>

      {feedback && (
        <p className="term-alert" style={{ color: feedback.color, marginBottom: 24 }}>
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
        <p className="term-alert" style={{ color: STATUS_LABELS[order.status]?.color ?? 'var(--muted)', fontWeight: 700 }}>
          {STATUS_LABELS[order.status]?.text}
        </p>
      )}
      </main>
    </div>
  );
}
