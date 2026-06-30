const { Client } = require('pg');

const dbConfig = {
  host: '3.89.151.149',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'bullmachine_DB',
};

async function main() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database.");
    
    console.log("Clearing all data from overdue_orders and stocks tables...");
    await client.query("TRUNCATE TABLE overdue_orders RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE TABLE stocks RESTART IDENTITY CASCADE");
    console.log("Tables successfully cleared and reset!");
    
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    await client.end();
  }
}

main();
