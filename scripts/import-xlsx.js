const XLSX = require('xlsx');
const { Client } = require('pg');
const path = require('path');

const dbConfig = {
  host: '3.89.151.149',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'bullmachine_DB',
};

function parseExcelDate(val) {
  if (val === null || val === undefined || val === '') return null;
  
  // If Excel parsed it as a Date object:
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  
  // If Excel parsed it as a serial number:
  if (typeof val === 'number') {
    // 25569 is the offset of days between 1899-12-30 and 1970-01-01
    const date = new Date((val - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }
  
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
    
    // Check for DD/MM/YYYY or DD-MM-YYYY format
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return trimmed;
  }
  
  return null;
}

const convertInt = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

const convertFloat = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

async function main() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database.");
    
    // 1. Drop and Recreate tables to ensure correct column types (TEXT instead of VARCHAR, DOUBLE PRECISION for stock quantities)
    console.log("Dropping existing tables to upgrade schemas...");
    await client.query("DROP TABLE IF EXISTS overdue_orders CASCADE");
    await client.query("DROP TABLE IF EXISTS stocks CASCADE");
    
    console.log("Re-creating tables with upgraded schemas...");
    await client.query(`
      CREATE TABLE overdue_orders (
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
    
    await client.query(`
      CREATE TABLE stocks (
        id SERIAL PRIMARY KEY,
        item TEXT NOT NULL,
        current_stock_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
        minimum_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
        material TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tables created successfully.");

    // 2. Import Overdue Orders
    const poFile = path.join(process.cwd(), 'doc', 'bull machine - po.xlsx');
    console.log(`Reading PO Excel file: ${poFile}...`);
    const poWorkbook = XLSX.readFile(poFile);
    const poSheetName = poWorkbook.SheetNames[0];
    const poWorksheet = poWorkbook.Sheets[poSheetName];
    const poRows = XLSX.utils.sheet_to_json(poWorksheet, { defval: null });
    console.log(`Found ${poRows.length} rows in PO sheet.`);

    console.log("Importing PO rows into postgres...");
    // Let's do this in a single transaction
    await client.query("BEGIN");
    
    const overdueSql = `
      INSERT INTO overdue_orders (
        plant, purchasing_group, material, mat_desc, vendor_code, vendor_name, 
        vendor_number, vendor_email, po_no, order_due_date, po_item_no, uom, 
        delivery_schedule_qty, pending_qty, despatch_date_supplier, delivery_date_bull, 
        asn_number, further_despatch_date, form_id, thanking_you_email, trigger_id, first_mail_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    `;

    for (let i = 0; i < poRows.length; i++) {
      const row = poRows[i];
      const params = [
        row['Plant'] !== null ? String(row['Plant']) : null,
        row['Purchasing Group'] !== null ? String(row['Purchasing Group']) : null,
        row['Material'] !== null ? String(row['Material']) : null,
        row['Mat. Desc'] !== null ? String(row['Mat. Desc']) : null,
        row['Vendor Code'] !== null ? String(row['Vendor Code']) : null,
        row['Vendor Name'] !== null ? String(row['Vendor Name']) : null,
        row['vendor number'] !== null ? String(row['vendor number']) : null,
        row['vendor email'] !== null ? String(row['vendor email']) : null,
        row['PO No'] !== null ? String(row['PO No']) : null,
        parseExcelDate(row['Order Due Date']),
        row['PO Item No'] !== null ? String(row['PO Item No']) : null,
        row['UOM'] !== null ? String(row['UOM']) : null,
        convertInt(row['Delivery Schedule Quantity']),
        convertInt(row['Pending Qty']),
        parseExcelDate(row['Despatch Date from Supplier']),
        parseExcelDate(row['Delivery Date At Bull']),
        row['If despatched means ASN Number'] !== null ? String(row['If despatched means ASN Number']) : null,
        parseExcelDate(row['If not despatched means further despatch date']),
        row['form id'] !== null ? String(row['form id']) : null,
        row['thanking you email'] !== null ? String(row['thanking you email']) : null,
        row['trigger id'] !== null ? String(row['trigger id']) : null,
        row['first mail sent'] !== null ? String(row['first mail sent']) : null
      ];
      
      await client.query(overdueSql, params);
    }
    await client.query("COMMIT");
    console.log(`Successfully imported ${poRows.length} overdue orders.`);

    // 3. Import Stocks
    const stocksFile = path.join(process.cwd(), 'doc', 'stocks - bull machine.xlsx');
    console.log(`Reading Stocks Excel file: ${stocksFile}...`);
    const stocksWorkbook = XLSX.readFile(stocksFile);
    const stocksSheetName = stocksWorkbook.SheetNames[0];
    const stocksWorksheet = stocksWorkbook.Sheets[stocksSheetName];
    const stocksRows = XLSX.utils.sheet_to_json(stocksWorksheet, { defval: null });
    console.log(`Found ${stocksRows.length} rows in Stocks sheet.`);

    console.log("Importing Stocks rows into postgres...");
    await client.query("BEGIN");
    
    const stocksSql = `
      INSERT INTO stocks (item, current_stock_quantity, minimum_quantity, material)
      VALUES ($1, $2, $3, $4)
    `;

    for (let i = 0; i < stocksRows.length; i++) {
      const row = stocksRows[i];
      const params = [
        row['item'] !== null ? String(row['item']) : null,
        convertFloat(row['currentStockQuantity']) || 0,
        convertFloat(row['minimumQuantity']) || 0,
        row['material'] !== null ? String(row['material']) : null
      ];
      await client.query(stocksSql, params);
    }
    await client.query("COMMIT");
    console.log(`Successfully imported ${stocksRows.length} stock items.`);

    console.log("\nALL XLSX DATA IMPORTED SUCCESSFULLY TO POSTGRESQL!");
  } catch (error) {
    console.error("Critical Import Error:", error);
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
  } finally {
    await client.end();
  }
}

main();
