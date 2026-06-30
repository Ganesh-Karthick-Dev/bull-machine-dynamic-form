import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

let dbInitialized = false;
const ensureDb = async () => {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
};

export async function GET() {
  try {
    await ensureDb();
    
    // 1. Fetch overdue orders count
    const ordersRes = await query('SELECT COUNT(*) FROM overdue_orders');
    const overdueOrdersCount = parseInt(ordersRes.rows[0].count, 10);
    
    // 2. Fetch stocks count and total quantity
    const stocksRes = await query('SELECT COUNT(*), SUM(current_stock_quantity) FROM stocks');
    const stockItemsCount = parseInt(stocksRes.rows[0].count, 10);
    const totalStockQuantity = parseInt(stocksRes.rows[0].sum || '0', 10);
    
    // 3. Fetch low stock alert count
    const alertsRes = await query('SELECT COUNT(*) FROM stocks WHERE current_stock_quantity < minimum_quantity');
    const lowStockAlertsCount = parseInt(alertsRes.rows[0].count, 10);
    
    return NextResponse.json({
      overdueOrdersCount,
      stockItemsCount,
      totalStockQuantity,
      lowStockAlertsCount
    });
  } catch (error: any) {
    console.error("GET overview metrics error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
