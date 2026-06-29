'use client';

import { useEffect } from 'react';

// Boundary global de errores (req. Etapa 2: manejo de errores generales)
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="term-center">
      <div className="term-card term-card--orange" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <p className="term-h term-h--xl" style={{ color: 'var(--red)' }}>500</p>
        <h1 className="term-h term-h--md" style={{ marginTop: 8 }}>Algo salió mal</h1>
        <p className="term-muted">Ocurrió un error inesperado al procesar tu solicitud.</p>
        <button onClick={reset} className="term-btn term-btn--orange" style={{ marginTop: 20 }}>
          Reintentar
        </button>
      </div>
    </main>
  );
}
