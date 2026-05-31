'use client';

import { useActionState } from 'react';
import { updateOrderStatus, type ActionResult } from './actions';
import type { OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['payment_pending', 'paid', 'failed', 'cancelled', 'closed'];

export default function StatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateOrderStatus,
    null
  );

  return (
    <form action={formAction} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <input type="hidden" name="order_id" value={orderId} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="status" style={{ fontSize: 12, color: '#555' }}>
          Cambiar estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          style={{ padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6 }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '9px 16px',
          background: pending ? '#888' : '#111',
          color: '#fff',
          border: 0,
          borderRadius: 6,
          cursor: pending ? 'default' : 'pointer',
        }}
      >
        {pending ? 'Guardando…' : 'Guardar'}
      </button>
      {state && (
        <p
          role="status"
          style={{ margin: 0, fontSize: 13, color: state.ok ? '#166534' : '#b91c1c' }}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
