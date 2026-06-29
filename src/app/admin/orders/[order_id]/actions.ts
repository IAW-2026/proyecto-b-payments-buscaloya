'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { isAdminRole } from '@/lib/auth';
import type { OrderStatus } from '@/types';

const VALID_STATUSES: OrderStatus[] = ['payment_pending', 'paid', 'failed', 'cancelled', 'closed'];

export interface ActionResult {
  ok: boolean;
  message: string;
}

// Gestión admin del estado de una orden. Validación 100% del lado del servidor.
export async function updateOrderStatus(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Re-verificar autorización dentro de la acción (no confiar sólo en el layout)
  const { userId, sessionClaims } = await auth();
  if (!userId || !isAdminRole(sessionClaims?.metadata?.role)) {
    return { ok: false, message: 'No autorizado.' };
  }

  const orderId = String(formData.get('order_id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  // Validación de formulario del lado del servidor (req. Etapa 2)
  if (!orderId) {
    return { ok: false, message: 'Falta el identificador de la orden.' };
  }
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, message: `Estado inválido. Permitidos: ${VALID_STATUSES.join(', ')}.` };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('order_id')
    .eq('order_id', orderId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, message: 'La orden no existe.' };
  }

  const { error } = await supabase.from('orders').update({ status }).eq('order_id', orderId);
  if (error) {
    return { ok: false, message: `Error al actualizar: ${error.message}` };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin');
  return { ok: true, message: `Estado actualizado a "${status}".` };
}
