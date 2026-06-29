'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  orderId: string;
}

// Botón de respaldo: simula la aprobación del pago sin pasar por MercadoPago.
// Pega contra /api/payments/simulate, que marca la orden como 'paid' y notifica
// a Seller y Buyer. Usar solo mientras MP no esté disponible.
export default function SimulatePaymentButton({ orderId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? 'No se pudo simular el pago');
        return;
      }
      router.push(`${process.env.NEXT_PUBLIC_BUYER_APP_URL}/purchase`);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="term-btn term-btn--outline"
      >
        {loading ? 'Simulando…' : 'Simular pago aprobado (sin MP)'}
      </button>
      {error && (
        <p className="term-alert" style={{ color: '#ff5252', marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
