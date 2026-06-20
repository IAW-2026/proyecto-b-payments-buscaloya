import { NextRequest, NextResponse } from 'next/server';
import { mpPayment } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabase';
import { notifySellerPaymentStatus } from '@/lib/services/seller.service';
import { notifyBuyerPaymentStatus } from '@/lib/services/buyer.service';
import type { OrderStatus } from '@/types';

const MP_STATUS_MAP: Record<string, OrderStatus> = {
  approved: 'paid',
  rejected: 'failed',
  pending: 'payment_pending',
  in_process: 'payment_pending',
  cancelled: 'cancelled',
};

// POST /api/payments/process — llamado por el Payment Brick al confirmar el pago
export async function POST(req: NextRequest) {
  const { formData, order_id } = await req.json();

  // Obtener buyer_id antes de procesar (necesario para notificar a Buyer)
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('buyer_id')
    .eq('order_id', order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const payment = await mpPayment.create({
    body: {
      ...formData,
      external_reference: order_id,
    },
  });

  const newStatus = MP_STATUS_MAP[payment.status!] ?? 'payment_pending';

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus, mp_payment_id: payment.id })
    .eq('order_id', order_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notificar a Seller y Buyer en paralelo si el pago tuvo resultado definitivo
  if (newStatus === 'paid' || newStatus === 'failed') {
    await Promise.allSettled([
      notifySellerPaymentStatus(order_id, newStatus),
      notifyBuyerPaymentStatus(order_id, newStatus),
    ]);
  }

  return NextResponse.json({ status: newStatus, payment_id: payment.id });
}
