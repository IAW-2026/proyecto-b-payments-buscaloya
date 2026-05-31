'use client';

import { useEffect } from 'react';

// Boundary global de errores (req. Etapa 2: manejo de errores generales)
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <p style={{ fontSize: 64, margin: 0, fontWeight: 800, color: '#b91c1c' }}>500</p>
      <h1 style={{ fontSize: 20, marginTop: 8 }}>Algo salió mal</h1>
      <p style={{ color: '#666' }}>Ocurrió un error inesperado al procesar tu solicitud.</p>
      <button
        onClick={reset}
        style={{
          marginTop: 16,
          padding: '10px 18px',
          background: '#111',
          color: '#fff',
          border: 0,
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Reintentar
      </button>
    </main>
  );
}
