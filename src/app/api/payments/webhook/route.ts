import { NextRequest, NextResponse } from 'next/server';
import { mpPayment } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabase';
import { notifyBuyerPaymentStatus } from '@/lib/services/buyer.service';
import type { OrderStatus } from '@/types';

const MP_STATUS_MAP: Record<string, OrderStatus> = {
  approved: 'paid',
  rejected: 'failed',
  pending: 'payment_pending',
  in_process: 'payment_pending',
  cancelled: 'cancelled',
};

// POST /api/payments/webhook — llamado por MercadoPago cuando cambia el estado del pago
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type !== 'payment') {
    return NextResponse.json({ received: true });
  }

  const paymentInfo = await mpPayment.get({ id: body.data.id });
  const orderId = paymentInfo.external_reference;
  const newStatus = MP_STATUS_MAP[paymentInfo.status!] ?? 'payment_pending';

  // Obtener buyer_id antes de actualizar (necesario para notificar a Buyer)
  const { data: order } = await supabase
    .from('orders')
    .select('buyer_id')
    .eq('order_id', orderId)
    .single();

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus, mp_payment_id: body.data.id })
    .eq('order_id', orderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ((newStatus === 'paid' || newStatus === 'failed') && order) {
    await notifyBuyerPaymentStatus(orderId!, newStatus);
  }

  return NextResponse.json({ received: true });
}
