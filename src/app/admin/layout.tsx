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
      <main className="term-center">
        <div className="term-card term-card--orange" style={{ maxWidth: 520, width: '100%' }}>
          <p className="term-label term-label--orange">Acceso denegado</p>
          <h1 className="term-h term-h--md" style={{ marginBottom: 12 }}>
            403 — Acceso restringido
          </h1>
          <p className="term-muted">
            Necesitás el rol <code style={{ color: 'var(--green)' }}>finance_admin</code> para acceder
            al panel financiero.
          </p>
          <div style={{ marginTop: 20 }}>
            <UserButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div>
      <header className="term-topbar">
        <nav aria-label="Navegación principal">
          <Link href="/admin" className="term-h term-h--md" style={{ fontSize: 20 }}>
            ▌ Panel Financiero
          </Link>
          <Link href="/admin" className="term-muted">
            Órdenes
          </Link>
        </nav>
        {/* UserButton incluye el logout (req. Etapa 2: logout admin) */}
        <UserButton />
      </header>
      <main className="term-shell">{children}</main>
    </div>
  );
}
