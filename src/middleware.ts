import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Rutas que no requieren ningún tipo de auth
const isPublicApiPath = createRouteMatcher([
  '/api/health',
  '/api/payments/webhook',
  '/api/payments/process',
  '/api/payments/simulate',
]);

// Rutas de inter-servicio: validan su propia API key en el handler, no necesitan Clerk
const isServiceApiPath = createRouteMatcher([
  '/api/payments/orders',
  '/api/payments/issue',
  '/api/payments/operations/:order_id/close',
]);

// Rutas que usan Clerk (browser del comprador / admin)
const isCheckoutPath = createRouteMatcher(['/checkout(.*)']);
const isAdminPath = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Rutas API públicas — sin auth
  if (isPublicApiPath(req)) return NextResponse.next();

  // Rutas de inter-servicio — la API key se valida en el route handler
  if (isServiceApiPath(req)) return NextResponse.next();

  // Checkout — protegido por Clerk (JWT de sesión)
  if (isCheckoutPath(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  // Panel admin — exige login; el chequeo de rol finance_admin se hace en el layout
  if (isAdminPath(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  // Resto de /api/* — requiere Bearer token (JWT de Clerk o service token)
  if (pathname.startsWith('/api/')) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/', '/api/:path*', '/checkout/:path*', '/admin/:path*'],
};
