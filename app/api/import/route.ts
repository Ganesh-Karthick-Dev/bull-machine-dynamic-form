import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

function parseExcelDate(val: any) {
  if (val === null || val === undefined || val === '') return null;
  
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }
  
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
    
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

const convertInt = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

const convertFloat = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

export async function POST(request: Request) {
  const client = await getClient();
  try {
    const body = await request.json();
    const { type, rows } = body;

    if (!type || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await client.query('BEGIN');

    if (type === 'overdue') {
      console.log(`Starting bulk import of ${rows.length} overdue orders...`);
      // Clear existing overdue orders
      await client.query('TRUNCATE TABLE overdue_orders RESTART IDENTITY CASCADE');

      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valueClauses = [];
        const params = [];
        let paramIndex = 1;

        for (const row of batch) {
          const rowVals = [
            row['Plant'] !== null && row['Plant'] !== undefined ? String(row['Plant']) : null,
            row['Purchasing Group'] !== null && row['Purchasing Group'] !== undefined ? String(row['Purchasing Group']) : null,
            row['Material'] !== null && row['Material'] !== undefined ? String(row['Material']) : null,
            row['Mat. Desc'] !== null && row['Mat. Desc'] !== undefined ? String(row['Mat. Desc']) : null,
            row['Vendor Code'] !== null && row['Vendor Code'] !== undefined ? String(row['Vendor Code']) : null,
            row['Vendor Name'] !== null && row['Vendor Name'] !== undefined ? String(row['Vendor Name']) : null,
            row['vendor number'] !== null && row['vendor number'] !== undefined ? String(row['vendor number']) : null,
            row['vendor email'] !== null && row['vendor email'] !== undefined ? String(row['vendor email']) : null,
            row['PO No'] !== null && row['PO No'] !== undefined ? String(row['PO No']) : null,
            parseExcelDate(row['Order Due Date']),
            row['PO Item No'] !== null && row['PO Item No'] !== undefined ? String(row['PO Item No']) : null,
            row['UOM'] !== null && row['UOM'] !== undefined ? String(row['UOM']) : null,
            convertInt(row['Delivery Schedule Quantity']),
            convertInt(row['Pending Qty']),
            parseExcelDate(row['Despatch Date from Supplier']),
            parseExcelDate(row['Delivery Date At Bull']),
            row['If despatched means ASN Number'] !== null && row['If despatched means ASN Number'] !== undefined ? String(row['If despatched means ASN Number']) : null,
            parseExcelDate(row['If not despatched means further despatch date']),
            row['form id'] !== null && row['form id'] !== undefined ? String(row['form id']) : null,
            row['thanking you email'] !== null && row['thanking you email'] !== undefined ? String(row['thanking you email']) : null,
            row['trigger id'] !== null && row['trigger id'] !== undefined ? String(row['trigger id']) : null,
            row['first mail sent'] !== null && row['first mail sent'] !== undefined ? String(row['first mail sent']) : null
          ];
          
          const placeholders = [];
          for (let j = 0; j < 22; j++) {
            placeholders.push(`$${paramIndex++}`);
          }
          valueClauses.push(`(${placeholders.join(', ')})`);
          params.push(...rowVals);
        }

        const insertSql = `
          INSERT INTO overdue_orders (
            plant, purchasing_group, material, mat_desc, vendor_code, vendor_name, 
            vendor_number, vendor_email, po_no, order_due_date, po_item_no, uom, 
            delivery_schedule_qty, pending_qty, despatch_date_supplier, delivery_date_bull, 
            asn_number, further_despatch_date, form_id, thanking_you_email, trigger_id, first_mail_sent
          ) VALUES ${valueClauses.join(', ')}
        `;
        await client.query(insertSql, params);
      }

    } else if (type === 'stocks') {
      console.log(`Starting bulk import of ${rows.length} stock items...`);
      // Clear existing stocks
      await client.query('TRUNCATE TABLE stocks RESTART IDENTITY CASCADE');

      const batchSize = 1000;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valueClauses = [];
        const params = [];
        let paramIndex = 1;

        for (const row of batch) {
          const rowVals = [
            row['item'] !== null && row['item'] !== undefined ? String(row['item']) : null,
            convertFloat(row['currentStockQuantity']) || 0,
            convertFloat(row['minimumQuantity']) || 0,
            row['material'] !== null && row['material'] !== undefined ? String(row['material']) : null
          ];
          
          const placeholders = [];
          for (let j = 0; j < 4; j++) {
            placeholders.push(`$${paramIndex++}`);
          }
          valueClauses.push(`(${placeholders.join(', ')})`);
          params.push(...rowVals);
        }

        const insertSql = `
          INSERT INTO stocks (item, current_stock_quantity, minimum_quantity, material)
          VALUES ${valueClauses.join(', ')}
        `;
        await client.query(insertSql, params);
      }
    } else {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Import API error:', error);
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE overdue_orders RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE stocks RESTART IDENTITY CASCADE');
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Clear DB API error:', error);
    return NextResponse.json({ error: error.message || 'Clear failed' }, { status: 500 });
  } finally {
    client.release();
  }
}
