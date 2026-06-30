const { Client } = require('pg');

const liveConfig = {
  host: '3.89.151.149',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'bullmachine_DB',
};

async function main() {
  console.log("Client 1 connecting...");
  const client1 = new Client(liveConfig);
  await client1.connect();
  
  console.log("Inserting a dummy order...");
  const res = await client1.query(`
    INSERT INTO overdue_orders (po_no, plant, material, pending_qty)
    VALUES ('PO_TEST_999', 'TEST', 'MAT_TEST', 10)
    RETURNING id
  `);
  const insertedId = res.rows[0].id;
  console.log("Inserted ID:", insertedId);
  
  const count1 = await client1.query("SELECT COUNT(*) FROM overdue_orders");
  console.log("Client 1 sees count:", count1.rows[0].count);
  
  await client1.end();
  console.log("Client 1 disconnected.");
  
  console.log("Waiting 2 seconds...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("Client 2 connecting...");
  const client2 = new Client(liveConfig);
  await client2.connect();
  
  const count2 = await client2.query("SELECT COUNT(*) FROM overdue_orders");
  console.log("Client 2 sees count:", count2.rows[0].count);
  
  // Clean up
  await client2.query("DELETE FROM overdue_orders WHERE id = $1", [insertedId]);
  console.log("Cleaned up dummy order.");
  
  await client2.end();
}

main().catch(console.error);
