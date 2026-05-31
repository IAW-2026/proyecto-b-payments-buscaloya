import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/orders/:order_id — detalle de una orden
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const { order_id } = await params;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', order_id)
    .single();

  if (error) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json(data);
}
