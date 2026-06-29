import type { OrderStatus } from '@/types';

// Llamado tras confirmar el pago con MP — Seller dispara la misión logística
export async function notifySellerPaymentStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await fetch(`${process.env.SELLER_APP_URL}/api/seller/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SELLER_API_KEY}`,
    },
    body: JSON.stringify({ order_id: orderId, status }),
  });
}
