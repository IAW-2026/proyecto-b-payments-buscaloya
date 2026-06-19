import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { mpPreference } from '@/lib/mercadopago';
import { notifySellerOrderCreated } from '@/lib/services/seller.service';
import { validateApiKey } from '@/lib/api-auth';
import type { CreateOrderPayload } from '@/types';

// POST /api/payments/orders — llamado por Seller App con el JWT del buyer y el delivery_cost ya calculado
export async function POST(req: NextRequest) {
  const authError = validateApiKey(req, process.env.SELLER_API_KEY);
  if (authError) return authError;

  const body: CreateOrderPayload = await req.json();
  const { buyer_id, store_id, items, delivery_address, delivery_cost, quote_id, quote_estimated_minutes } = body;

  if (!buyer_id || !store_id || !items?.length || !delivery_address || delivery_cost == null || !quote_id || quote_estimated_minutes == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // F1: cada item debe incluir seller_id para poder hacer liquidaciones por vendedor
  if (items.some((item) => !item.seller_id)) {
    return NextResponse.json({ error: 'Each item must include seller_id' }, { status: 400 });
  }

  const itemsTotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalAmount = itemsTotal + delivery_cost;
  const orderId = uuidv4();

  const preference = await mpPreference.create({
    body: {
      external_reference: orderId,
      items: items.map((item) => ({
        id: item.product_id,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'ARS',
      })),
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${orderId}?status=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${orderId}?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${orderId}?status=pending`,
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
    },
  });

  const { error } = await supabase.from('orders').insert({
    order_id: orderId,
    buyer_id,
    store_id,
    status: 'payment_pending',
    total_amount: totalAmount,
    delivery_cost,
    mp_preference_id: preference.id,
    items_snapshot: items,
    delivery_address_snapshot: delivery_address,
    delivery_quote_snapshot: { quote_id, cost: delivery_cost, estimated_minutes: quote_estimated_minutes },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notificar a Seller que existe una nueva orden pendiente de pago (fire-and-forget)
  notifySellerOrderCreated(orderId).catch(console.error);

  return NextResponse.json(
    {
      order_id: orderId,
      mp_preference_id: preference.id,
      total_amount: totalAmount,
      delivery_cost,
      status: 'payment_pending',
    },
    { status: 201 }
  );
}

// GET /api/payments/orders?buyer_id=xxx — historial de órdenes de un comprador
export async function GET(req: NextRequest) {
  const buyerId = req.nextUrl.searchParams.get('buyer_id');

  let query = supabase
    .from('orders')
    .select('order_id, status, total_amount, delivery_cost, created_at')
    .order('created_at', { ascending: false });

  if (buyerId) query = query.eq('buyer_id', buyerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
