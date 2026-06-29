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
    <form action={formAction} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <input type="hidden" name="order_id" value={orderId} />
      <div className="term-field">
        <label htmlFor="status">Cambiar estado</label>
        <select id="status" name="status" defaultValue={currentStatus} className="term-select">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="term-btn">
        {pending ? 'Guardando…' : 'Guardar'}
      </button>
      {state && (
        <p
          role="status"
          style={{ margin: 0, fontSize: 13, color: state.ok ? 'var(--green)' : 'var(--red)' }}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
