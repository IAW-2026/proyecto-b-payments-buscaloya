import type { OrderStatus } from '@/types';

// Color neón por estado (borde + texto usan currentColor en .term-badge)
const STATUS_STYLES: Record<OrderStatus, { label: string; color: string }> = {
  payment_pending: { label: 'Pago pendiente', color: '#ff5a00' },
  paid: { label: 'Pagado', color: '#39ff14' },
  failed: { label: 'Rechazado', color: '#ff5252' },
  cancelled: { label: 'Cancelado', color: '#7a7a7a' },
  closed: { label: 'Cerrado', color: '#ff1b8d' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status] ?? { label: status, color: '#7a7a7a' };
  return (
    <span className="term-badge" style={{ color: s.color }}>
      {s.label}
    </span>
  );
}
