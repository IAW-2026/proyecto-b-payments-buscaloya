export {};

// Roles definidos en docs/05.usuarios.md (publicMetadata.role en Clerk).
// Para que `role` llegue en el JWT hay que customizar el session token en Clerk:
//   Dashboard → Sessions → Customize session token → { "metadata": "{{user.public_metadata}}" }
export type AppRole =
  | 'buyer'
  | 'seller'
  | 'courier'
  | 'finance_admin'
  | 'system_admin';

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: AppRole;
    };
  }

  // Controlador global que expone el Payment Brick de MercadoPago.
  // Lo usamos para destruir la instancia y evitar bricks duplicados.
  interface Window {
    paymentBrickController?: { unmount: () => void };
  }
}
