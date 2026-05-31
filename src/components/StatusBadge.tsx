import type { OrderStatus } from '@/types';

const STATUS_STYLES: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  payment_pending: { label: 'Pago pendiente', bg: '#fef3c7', fg: '#92400e' },
  paid: { label: 'Pagado', bg: '#dcfce7', fg: '#166534' },
  failed: { label: 'Rechazado', bg: '#fee2e2', fg: '#991b1b' },
  cancelled: { label: 'Cancelado', bg: '#e5e7eb', fg: '#374151' },
  closed: { label: 'Cerrado', bg: '#dbeafe', fg: '#1e40af' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status] ?? { label: status, bg: '#e5e7eb', fg: '#374151' };
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}
