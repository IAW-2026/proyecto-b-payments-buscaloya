import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifySellerPaymentStatus } from '@/lib/services/seller.service';
import { notifyBuyerPaymentStatus } from '@/lib/services/buyer.service';
import type { OrderStatus } from '@/types';

// POST /api/payments/simulate — WORKAROUND temporal mientras MercadoPago no está disponible.
// Marca la orden como 'paid' sin pasar por MP y dispara las MISMAS notificaciones a
// Seller y Buyer que el flujo real (/api/payments/process y /webhook), para que ambas
// apps actualicen su estado.
export async function POST(req: NextRequest) {
  const { order_id } = await req.json();

  if (!order_id) {
    return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
  }

  // Verificar que la orden existe antes de tocarla
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('order_id, buyer_id, status')
    .eq('order_id', order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const newStatus: OrderStatus = 'paid';
  const fakePaymentId = `SIMULATED-${Date.now()}`;

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus, mp_payment_id: fakePaymentId })
    .eq('order_id', order_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notificar a Seller y Buyer en paralelo, igual que el flujo de pago real
  const [seller, buyer] = await Promise.allSettled([
    notifySellerPaymentStatus(order_id, newStatus),
    notifyBuyerPaymentStatus(order_id, newStatus),
  ]);

  return NextResponse.json({
    status: newStatus,
    payment_id: fakePaymentId,
    notifications: { seller: seller.status, buyer: buyer.status },
  });
}
