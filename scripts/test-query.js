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
  await client.connect();
  console.log("Connected to live database...");
  
  const ordersCount = await client.query("SELECT COUNT(*) FROM overdue_orders");
  console.log("Orders count in DB:", ordersCount.rows[0].count);
  
  const stocksCount = await client.query("SELECT COUNT(*) FROM stocks");
  console.log("Stocks count in DB:", stocksCount.rows[0].count);
  
  const sampleOrders = await client.query("SELECT * FROM overdue_orders LIMIT 3");
  console.log("Sample Orders:", sampleOrders.rows);
  
  await client.end();
}

main().catch(console.error);
