'use client';

import { useEffect } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'es-AR' });

interface Props {
  preferenceId: string;
  totalAmount: number;
  orderId: string;
}

export default function PaymentBrick({ preferenceId, totalAmount, orderId }: Props) {
  // Al desmontar, destruir el brick para que un re-montaje no lo duplique.
  // Bug conocido del SDK: si se re-renderiza sin unmount, el brick se apila.
  // https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/additional-content/possible-errors
  useEffect(() => {
    return () => {
      window.paymentBrickController?.unmount();
    };
  }, []);

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
