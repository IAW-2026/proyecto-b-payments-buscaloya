import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { OrderItem } from '@/types';

interface CloseOperationPayload {
  delivery_id: string;
  courier_id: string;
  delivered_at: string;
}

interface Liquidation {
  recipient_id: string;
  recipient_type: 'seller' | 'courier';
  amount: number;
  status: 'pending';
}

// POST /api/payments/operations/[order_id]/close — llamado por Delivery App al confirmar entrega física
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SERVICE_TOKEN}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { order_id } = await params;
  const body: CloseOperationPayload = await req.json();
  const { delivery_id, courier_id, delivered_at } = body;

  if (!delivery_id || !courier_id || !delivered_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('order_id, status, items_snapshot, delivery_cost')
    .eq('order_id', order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }

  if (order.status === 'closed') {
    return NextResponse.json(
      { error: 'operation_already_closed', message: 'Esta operación ya fue liquidada.' },
      { status: 409 }
    );
  }

  if (order.status !== 'paid') {
    return NextResponse.json(
      { error: 'transaction_not_approved', message: 'No se puede cerrar una orden que no fue pagada.' },
      { status: 422 }
    );
  }

  // Agrupar items por seller_id y sumar montos
  const sellerTotals = (order.items_snapshot as OrderItem[]).reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.seller_id] = (acc[item.seller_id] ?? 0) + item.unit_price * item.quantity;
      return acc;
    },
    {}
  );

  const liquidations: Liquidation[] = [
    ...Object.entries(sellerTotals).map(([seller_id, amount]) => ({
      recipient_id: seller_id,
      recipient_type: 'seller' as const,
      amount,
      status: 'pending' as const,
    })),
    {
      recipient_id: courier_id,
      recipient_type: 'courier',
      amount: order.delivery_cost,
      status: 'pending',
    },
  ];

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'closed' })
    .eq('order_id', order_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    order_id,
    status: 'closed',
    liquidations,
  });
}
