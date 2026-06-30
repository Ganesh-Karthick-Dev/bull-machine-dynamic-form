const { Client } = require('pg');

const config = {
  host: '3.89.151.149',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres', // connect to default first to list all
};

async function main() {
  const client = new Client(config);
  await client.connect();
  
  // List all databases
  const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
  console.log("Databases on server:", dbs.rows.map(r => r.datname));
  
  await client.end();
  
  // Now connect to bullmachine_DB and list tables
  const client2 = new Client({ ...config, database: 'bullmachine_DB' });
  await client2.connect();
  const tables = await client2.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log("Tables in bullmachine_DB:", tables.rows.map(r => r.table_name));
  
  // Check row counts
  for (const table of tables.rows.map(r => r.table_name)) {
    const count = await client2.query(`SELECT COUNT(*) FROM ${table}`);
    console.log(`Row count for ${table} in bullmachine_DB:`, count.rows[0].count);
  }
  
  await client2.end();
}

main().catch(console.error);
