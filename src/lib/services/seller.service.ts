import type { OrderStatus } from '@/types';

// Llamado inmediatamente después de crear la orden — Seller registra la orden pendiente de pago
export async function notifySellerOrderCreated(orderId: string): Promise<void> {
  await fetch(`${process.env.SELLER_APP_URL}/orders/${orderId}/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SELLER_API_KEY}`,
    },
    body: JSON.stringify({ order_id: orderId, status: 'payment_pending' }),
  });
}

// Llamado tras confirmar el pago con MP — Seller dispara la misión logística
export async function notifySellerPaymentStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await fetch(`${process.env.SELLER_APP_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SELLER_API_KEY}`,
    },
    body: JSON.stringify({ order_id: orderId, status }),
  });
}
