import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="term-center">
      <div className="term-card term-card--green" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <p className="term-h term-h--xl" style={{ color: 'var(--green)' }}>404</p>
        <h1 className="term-h term-h--md" style={{ marginTop: 8 }}>Página no encontrada</h1>
        <p className="term-muted">El recurso que buscás no existe o no tenés permiso para verlo.</p>
        <Link href="/" className="term-btn" style={{ marginTop: 20 }}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
