import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/payments/issue — llamado por Seller App para consultar el estado de pago
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SERVICE_TOKEN}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { order_id } = await req.json();

  if (!order_id) {
    return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('orders')
    .select('order_id, status, total_amount, delivery_cost, created_at')
    .eq('order_id', order_id)
    .single();

  if (error) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json(data);
}
