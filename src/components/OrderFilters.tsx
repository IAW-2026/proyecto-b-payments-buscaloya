'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['payment_pending', 'paid', 'failed', 'cancelled', 'closed'];

export default function OrderFilters({ q, status }: { q?: string; status?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(q ?? '');
  const [selectedStatus, setSelectedStatus] = useState(status ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(newQ: string, newStatus: string) {
    const params = new URLSearchParams();
    if (newQ) params.set('q', newQ);
    if (newStatus) params.set('status', newStatus);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(value, selectedStatus), 300);
  }

  function handleStatus(value: string) {
    setSelectedStatus(value);
    push(search, value);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
      <div className="term-field">
        <label htmlFor="q">Buscar (order_id o buyer_id)</label>
        <input
          id="q"
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="uuid o user_..."
          className="term-input"
          style={{ minWidth: 240 }}
        />
      </div>

      <div className="term-field">
        <label htmlFor="status">Estado</label>
        <select
          id="status"
          value={selectedStatus}
          onChange={(e) => handleStatus(e.target.value)}
          className="term-select"
        >
          <option value="">Todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <a href="/admin" className="term-btn term-btn--outline">Limpiar</a>
    </div>
  );
}
