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
  
  console.log("Terminating other database sessions...");
  const res = await client.query(`
    SELECT pid, pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = 'bullmachine_DB' AND pid <> pg_backend_pid()
  `);
  
  console.log(`Terminated ${res.rowCount} sessions.`);
  await client.end();
}

main().catch(console.error);
