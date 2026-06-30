const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '12345',
  database: 'postgres',
};

async function main() {
  const client = new Client(dbConfig);
  await client.connect();
  console.log("Connected to PostgreSQL database...");
  
  console.log("Creating index on overdue_orders(material)...");
  await client.query("CREATE INDEX IF NOT EXISTS idx_overdue_orders_material ON overdue_orders(material)");
  
  console.log("Creating index on stocks(material)...");
  await client.query("CREATE INDEX IF NOT EXISTS idx_stocks_material ON stocks(material)");
  
  console.log("Indexes created successfully!");
  await client.end();
}

main().catch(console.error);
