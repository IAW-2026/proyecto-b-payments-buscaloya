'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'es-AR' });

interface Props {
  preferenceId: string;
  totalAmount: number;
  orderId: string;
}

export default function PaymentBrick({ preferenceId, totalAmount, orderId }: Props) {
  const router = useRouter();

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
        visual: { style: { theme: 'dark' } },
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          mercadoPago: 'all',
        },
      }}
      onSubmit={async ({ formData }: { formData: unknown }) => {
        console.log('PaymentBrick onSubmit called. formData:', formData);
        try {
          const res = await fetch('/api/payments/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData, order_id: orderId }),
          });
          const result = await res.json();
          console.log('Payment process result:', result);
          if (result.status === 'paid' || result.status === 'failed') {
            router.push(`${process.env.NEXT_PUBLIC_BUYER_APP_URL}/purchase`);
          } else {
            router.refresh();
          }
          return result;
        } catch (error) {
          console.error('Error in PaymentBrick onSubmit fetch:', error);
          throw error;
        }
      }}
      onError={(error: unknown) => console.error('MercadoPago Brick error:', error)}
    />
  );
}
