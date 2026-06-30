const { Client } = require('pg');

const config = {
  host: '3.89.151.149',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres', 
};

async function main() {
  const client = new Client(config);
  await client.connect();
  
  // List tables in postgres DB
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log("Tables in postgres DB:", tables.rows.map(r => r.table_name));
  
  // Check row counts
  for (const table of tables.rows.map(r => r.table_name)) {
    const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
    console.log(`Row count for ${table} in postgres DB:`, count.rows[0].count);
  }
  
  await client.end();
}

main().catch(console.error);
