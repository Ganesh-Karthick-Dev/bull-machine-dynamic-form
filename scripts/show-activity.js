const { Client } = require('pg');

const config = {
  host: '3.89.151.149',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'bullmachine_DB',
};

async function main() {
  const client = new Client(config);
  await client.connect();
  
  console.log("Fetching active connections and queries...");
  const res = await client.query(`
    SELECT pid, usename, client_addr, backend_start, query_start, state, query 
    FROM pg_stat_activity 
    WHERE datname = 'bullmachine_DB' AND pid <> pg_backend_pid()
  `);
  
  console.log("\nActive Sessions:");
  res.rows.forEach(row => {
    console.log(`- PID: ${row.pid}, User: ${row.usename}, IP: ${row.client_addr}`);
    console.log(`  State: ${row.state}, Started: ${row.query_start}`);
    console.log(`  Query: ${row.query ? row.query.substring(0, 150) : 'N/A'}`);
    console.log('----------------------------------------------------');
  });
  
  await client.end();
}

main().catch(console.error);
