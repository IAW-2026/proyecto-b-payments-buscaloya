import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const authError = validateApiKey(req, process.env.PAYMENTS_API_KEY);
  if (authError) return authError;

  try {
    // 1. Obtener todas las órdenes
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_id, status, total_amount, delivery_cost, created_at');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Calcular métricas consolidadas
    let totalRevenue = 0;
    let totalEscrow = 0;
    const totalTransactions = orders?.length || 0;

    const statusCounts: Record<string, number> = {
      payment_pending: 0,
      paid: 0,
      failed: 0,
      cancelled: 0,
      closed: 0
    };

    const statusAmounts: Record<string, number> = {
      payment_pending: 0,
      paid: 0,
      failed: 0,
      cancelled: 0,
      closed: 0
    };

    for (const order of orders || []) {
      const s = order.status;
      if (s) {
        statusCounts[s] = (statusCounts[s] || 0) + 1;
        statusAmounts[s] = (statusAmounts[s] || 0) + (Number(order.total_amount) || 0);
      }
      // totalRevenue = paid + closed orders
      if (s === 'paid' || s === 'closed') {
        totalRevenue += Number(order.total_amount) || 0;
      }
      // escrow = paid (yet to be closed)
      if (s === 'paid') {
        totalEscrow += Number(order.total_amount) || 0;
      }
    }

    // 3. Transacciones recientes (ordenadas por fecha desc)
    const sortedOrders = [...(orders || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const recentTransactions = sortedOrders.slice(0, 10).map((o) => ({
      order_id: o.order_id,
      status: o.status,
      total_amount: o.total_amount,
      created_at: o.created_at
    }));

    return NextResponse.json({
      module: "payments",
      total_revenue: totalRevenue,
      total_escrow: totalEscrow,
      total_transactions: totalTransactions,
      status_counts: statusCounts,
      status_amounts: statusAmounts,
      recent_transactions: recentTransactions
    }, { status: 200 });

  } catch (err: any) {
    console.error("Error en API de analíticas de pagos:", err);
    return NextResponse.json({ 
      error: "internal_server_error", 
      message: err.message || "Ocurrió un error al calcular las métricas."
    }, { status: 500 });
  }
}
