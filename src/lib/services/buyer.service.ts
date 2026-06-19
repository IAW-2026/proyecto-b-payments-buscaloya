import type { OrderStatus } from '@/types';

// Buyer App espera status en mayúsculas según contrato de API (docs/03-apis.md #3)
const BUYER_STATUS_MAP: Partial<Record<OrderStatus, string>> = {
  paid: 'PAID',
  cancelled: 'CANCELLED',
};

// Llamado en Promise.all junto a Seller tras confirmar el pago
export async function notifyBuyerPaymentStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const buyerStatus = BUYER_STATUS_MAP[status];
  if (!buyerStatus) return; // solo notificar en estados definitivos que Buyer reconoce

  await fetch(`${process.env.NEXT_PUBLIC_BUYER_APP_URL}/api/purchases/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BUYER_API_KEY}`,
    },
    body: JSON.stringify({ status: buyerStatus }),
  });
}
