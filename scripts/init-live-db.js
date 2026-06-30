const { Client } = require('pg');

const liveConfig = {
  host: '3.89.151.149',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'bullmachine_DB',
};

async function main() {
  const client = new Client(liveConfig);
  console.log("Connecting to live database at 3.89.151.149...");
  await client.connect();
  console.log("Connected successfully!");

  console.log("Creating table 'overdue_orders'...");
  await client.query(`
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

  console.log("Creating table 'stocks'...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS stocks (
      id SERIAL PRIMARY KEY,
      item TEXT NOT NULL,
      current_stock_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      minimum_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      material TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Creating database indexes for joins...");
  await client.query(`CREATE INDEX IF NOT EXISTS idx_overdue_orders_material ON overdue_orders(material)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_stocks_material ON stocks(material)`);

  console.log("All tables and indexes created successfully in live database 'bullmachine_DB'!");
  await client.end();
}

main().catch((err) => {
  console.error("Error creating tables on live database:", err);
  process.exit(1);
});
