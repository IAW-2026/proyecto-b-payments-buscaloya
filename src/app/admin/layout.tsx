import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { isAdminRole } from '@/lib/auth';

export const metadata = {
  title: 'Panel Financiero — Payments App',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth();

  // Login obligatorio para el panel
  if (!userId) redirect('/sign-in?redirect_url=/admin');

  // Sólo finance_admin / system_admin (docs/05.usuarios.md)
  if (!isAdminRole(sessionClaims?.metadata?.role)) {
    return (
      <main style={{ maxWidth: 520, margin: '80px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
        <h1 style={{ fontSize: 22 }}>403 — Acceso restringido</h1>
        <p style={{ color: '#555' }}>
          Necesitás el rol <code>finance_admin</code> para acceder al panel financiero.
        </p>
        <div style={{ marginTop: 16 }}>
          <UserButton />
        </div>
      </main>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid #eee',
        }}
      >
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }} aria-label="Navegación principal">
          <Link href="/admin" style={{ fontWeight: 700, color: '#111', textDecoration: 'none' }}>
            💳 Panel Financiero
          </Link>
          <Link href="/admin" style={{ color: '#555', textDecoration: 'none' }}>
            Órdenes
          </Link>
        </nav>
        {/* UserButton incluye el logout (req. Etapa 2: logout admin) */}
        <UserButton />

      </header>
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>{children}</main>
    </div>
  );
}
