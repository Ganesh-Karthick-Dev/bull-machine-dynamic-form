import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

// Ensure the database table exists and is seeded on startup/first load
let dbInitialized = false;
const ensureDb = async () => {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
};

const convertDate = (dateStr: string | null | undefined) => {
  if (!dateStr || dateStr.trim() === '') return null;
  return dateStr;
};

const convertInt = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

// 1. GET - Fetch overdue orders with server-side pagination, search, and plant filters
export async function GET(request: Request) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const search = searchParams.get('search') || '';
    const plant = searchParams.get('plant') || 'All';

    let whereClauses: string[] = [];
    let params: any[] = [];

    // Filter by search query (case-insensitive matches across key fields)
    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(po_no ILIKE $${params.length} OR vendor_name ILIKE $${params.length} OR material ILIKE $${params.length} OR mat_desc ILIKE $${params.length})`);
    }

    // Filter by plant code
    if (plant && plant !== 'All') {
      params.push(plant);
      whereClauses.push(`plant = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query 1: Total count for page calculation
    const countSql = `SELECT COUNT(*) FROM overdue_orders ${whereSql}`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Query 2: Page slice of data using LIMIT & OFFSET
    const offset = (page - 1) * limit;
    
    // Create query copy parameters for limits and offsets
    const dataParams = [...params];
    dataParams.push(limit);
    const limitParamIndex = dataParams.length;
    dataParams.push(offset);
    const offsetParamIndex = dataParams.length;

    const dataSql = `
      SELECT * FROM overdue_orders 
      ${whereSql} 
      ORDER BY id DESC 
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;
    const dataResult = await query(dataSql, dataParams);

    return NextResponse.json({
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("GET orders error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST - Create new overdue order
export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();

    const sql = `
      INSERT INTO overdue_orders (
        plant, purchasing_group, material, mat_desc, vendor_code, vendor_name, 
        vendor_number, vendor_email, po_no, order_due_date, po_item_no, uom, 
        delivery_schedule_qty, pending_qty, despatch_date_supplier, delivery_date_bull, 
        asn_number, further_despatch_date, form_id, thanking_you_email, trigger_id, first_mail_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const params = [
      body.plant || null,
      body.purchasingGroup || null,
      body.material || null,
      body.matDesc || null,
      body.vendorCode || null,
      body.vendorName || null,
      body.vendorNumber || null,
      body.vendorEmail || null,
      body.poNo || null,
      convertDate(body.orderDueDate),
      body.poItemNo || null,
      body.uom || null,
      convertInt(body.deliveryScheduleQty),
      convertInt(body.pendingQty),
      convertDate(body.despatchDateSupplier),
      convertDate(body.deliveryDateBull),
      body.asnNumber || null,
      convertDate(body.furtherDespatchDate),
      body.formId || null,
      body.thankingYouEmail || 'Pending',
      body.triggerId || null,
      body.firstMailSent || 'No'
    ];

    const result = await query(sql, params);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("POST order error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 3. PUT - Update an overdue order
export async function PUT(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const sql = `
      UPDATE overdue_orders SET 
        plant = $1, 
        purchasing_group = $2, 
        material = $3, 
        mat_desc = $4, 
        vendor_code = $5, 
        vendor_name = $6, 
        vendor_number = $7, 
        vendor_email = $8, 
        po_no = $9, 
        order_due_date = $10, 
        po_item_no = $11, 
        uom = $12, 
        delivery_schedule_qty = $13, 
        pending_qty = $14, 
        despatch_date_supplier = $15, 
        delivery_date_bull = $16, 
        asn_number = $17, 
        further_despatch_date = $18, 
        form_id = $19, 
        thanking_you_email = $20, 
        trigger_id = $21, 
        first_mail_sent = $22
      WHERE id = $23
      RETURNING *
    `;

    const params = [
      body.plant || null,
      body.purchasingGroup || null,
      body.material || null,
      body.matDesc || null,
      body.vendorCode || null,
      body.vendorName || null,
      body.vendorNumber || null,
      body.vendorEmail || null,
      body.poNo || null,
      convertDate(body.orderDueDate),
      body.poItemNo || null,
      body.uom || null,
      convertInt(body.deliveryScheduleQty),
      convertInt(body.pendingQty),
      convertDate(body.despatchDateSupplier),
      convertDate(body.deliveryDateBull),
      body.asnNumber || null,
      convertDate(body.furtherDespatchDate),
      body.formId || null,
      body.thankingYouEmail || 'Pending',
      body.triggerId || null,
      body.firstMailSent || 'No',
      body.id
    ];

    const result = await query(sql, params);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("PUT order error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 4. DELETE - Delete an overdue order
export async function DELETE(request: Request) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const result = await query('DELETE FROM overdue_orders WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error: any) {
    console.error("DELETE order error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
