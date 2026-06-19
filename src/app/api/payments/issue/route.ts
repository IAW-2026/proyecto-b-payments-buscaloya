import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

// POST /api/payments/issue — llamado por Seller App para consultar el estado de pago
export async function POST(req: NextRequest) {
  const authError = validateApiKey(req, process.env.SELLER_API_KEY);
  if (authError) return authError;

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
