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
  
  const countRes = await client.query("SELECT COUNT(*) FROM stocks");
  console.log("Total stocks rows:", countRes.rows[0].count);

  const uniqueRes = await client.query("SELECT COUNT(DISTINCT item) FROM stocks");
  console.log("Unique stocks items:", uniqueRes.rows[0].count);

  const dupRes = await client.query("SELECT item, COUNT(*) FROM stocks GROUP BY item HAVING COUNT(*) > 1 LIMIT 5");
  console.log("Sample duplicate items:", dupRes.rows);
  
  await client.end();
}

main().catch(console.error);
