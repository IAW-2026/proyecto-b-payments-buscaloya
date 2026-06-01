import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { isAdminRole } from '@/lib/auth';

// Punto de entrada: enruta según el rol del usuario autenticado.
//  - Sin sesión       → login de Clerk
//  - finance_admin    → panel de ventas (/admin)
//  - comprador        → checkout de su orden a pagar
export default async function Home() {
  const { userId, sessionClaims } = await auth();

  // Sin sesión → la primera vista es el login de Clerk
  if (!userId) redirect('/sign-in');

  // Admin → panel financiero / ventas
  if (isAdminRole(sessionClaims?.metadata?.role)) redirect('/admin');

  // Comprador → pagar una orden propia (prioriza la pendiente más reciente)
  const { data: orders } = await supabase
    .from('orders')
    .select('order_id, status, created_at')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  const list = orders ?? [];
  const target = list.find((o) => o.status === 'payment_pending') ?? list[0];

  if (target) redirect(`/checkout/${target.order_id}`);

  // El comprador no tiene órdenes asociadas en esta app
  return (
    <main style={{ maxWidth: 520, margin: '80px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>No tenés órdenes para pagar</h1>
      <p style={{ color: '#555', lineHeight: 1.6 }}>
        Todavía no hay ninguna orden asociada a tu cuenta. Las órdenes se generan desde la app de
        compras; cuando tengas una pendiente vas a poder pagarla desde acá.
      </p>
      <div style={{ marginTop: 16 }}>
        <UserButton />
      </div>
    </main>
  );
}
