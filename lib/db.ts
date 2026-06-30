import { Pool } from 'pg';

// Create a connection pool to the live PostgreSQL database
const pool = new Pool({
  host: '3.89.151.149',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'bullmachine_DB',
});

// Helper function to query the database
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Database Initialization & Seeding logic
export const initDatabase = async () => {
  try {
    // 1. Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS overdue_orders (
        id SERIAL PRIMARY KEY,
        plant TEXT,
        purchasing_group TEXT,
        material TEXT,
        mat_desc TEXT,
        vendor_code TEXT,
        vendor_name TEXT,
        vendor_number TEXT,
        vendor_email TEXT,
        po_no TEXT,
        order_due_date DATE,
        po_item_no TEXT,
        uom TEXT,
        delivery_schedule_qty INT,
        pending_qty INT,
        despatch_date_supplier DATE,
        delivery_date_bull DATE,
        asn_number TEXT,
        further_despatch_date DATE,
        form_id TEXT,
        thanking_you_email TEXT,
        trigger_id TEXT,
        first_mail_sent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create stocks table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stocks (
        id SERIAL PRIMARY KEY,
        item TEXT NOT NULL,
        current_stock_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
        minimum_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
        material TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Create indexes for high-performance joins
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_overdue_orders_material ON overdue_orders(material)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_stocks_material ON stocks(material)`);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};
