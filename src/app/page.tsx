import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 560, margin: '64px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Payments App</h1>
      <p style={{ color: '#666', marginTop: 0 }}>BuscaloYA — Microservicio de pagos</p>

      <p style={{ marginTop: 24, lineHeight: 1.6, color: '#444' }}>
        Orquesta el ciclo financiero de la plataforma: creación de órdenes, cobro vía MercadoPago,
        notificación a Seller/Buyer y liquidación a vendedores y repartidores.
      </p>

      <nav aria-label="Accesos" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <Link
          href="/admin"
          style={{ padding: '10px 18px', background: '#111', color: '#fff', borderRadius: 6, textDecoration: 'none' }}
        >
          Panel Financiero (admin)
        </Link>
        <a
          href="/api/health"
          style={{ padding: '10px 18px', border: '1px solid #ccc', borderRadius: 6, textDecoration: 'none', color: '#111' }}
        >
          Health check
        </a>
      </nav>
    </main>
  );
}
