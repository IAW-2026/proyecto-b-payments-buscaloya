'use client';

import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'es-AR' });

interface Props {
  preferenceId: string;
  totalAmount: number;
  orderId: string;
}

export default function PaymentBrick({ preferenceId, totalAmount, orderId }: Props) {
  return (
    <Payment
      initialization={{ amount: totalAmount, preferenceId }}
      customization={{
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
        },
      }}
      onSubmit={async ({ formData }: { formData: unknown }) => {
        const res = await fetch('/api/payments/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData, order_id: orderId }),
        });
        return res.json();
      }}
      onError={(error: unknown) => console.error('MercadoPago Brick error:', error)}
    />
  );
}
