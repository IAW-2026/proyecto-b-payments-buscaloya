import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 480,
        margin: '96px auto',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        padding: '0 16px',
      }}
    >
      <p style={{ fontSize: 64, margin: 0, fontWeight: 800, color: '#111' }}>404</p>
      <h1 style={{ fontSize: 20, marginTop: 8 }}>Página no encontrada</h1>
      <p style={{ color: '#666' }}>El recurso que buscás no existe o no tenés permiso para verlo.</p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginTop: 16,
          padding: '10px 18px',
          background: '#111',
          color: '#fff',
          borderRadius: 6,
          textDecoration: 'none',
        }}
      >
        Volver al inicio
      </Link>
    </main>
  );
}
