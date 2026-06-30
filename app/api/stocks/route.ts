import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

let dbInitialized = false;
const ensureDb = async () => {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
};

const convertInt = (val: any) => {
  if (val === undefined || val === null || val === '') return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
};

// 1. GET - Fetch stock records with server-side pagination, search, and status filters
export async function GET(request: Request) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'All';

    let whereClauses: string[] = [];
    let params: any[] = [];

    // Filter by search query (case-insensitive matches across item and material fields)
    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(item ILIKE $${params.length} OR material ILIKE $${params.length})`);
    }

    // Filter by low stock status (current < minimum)
    if (status && status === 'Low') {
      whereClauses.push(`current_stock_quantity < minimum_quantity`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query 1: Total count for page calculation
    const countSql = `SELECT COUNT(*) FROM stocks ${whereSql}`;
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
      SELECT * FROM stocks 
      ${whereSql} 
      ORDER BY id DESC 
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;
    const dataResult = await query(dataSql, dataParams);

    // Map database snake_case keys to camelCase for the API response
    const formattedRows = dataResult.rows.map(row => ({
      id: row.id,
      item: row.item,
      currentStockQuantity: row.current_stock_quantity,
      minimumQuantity: row.minimum_quantity,
      material: row.material,
      createdAt: row.created_at
    }));

    return NextResponse.json({
      data: formattedRows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("GET stocks error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST - Create new stock record
export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();

    const sql = `
      INSERT INTO stocks (item, current_stock_quantity, minimum_quantity, material)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const params = [
      body.item || null,
      convertInt(body.currentStockQuantity),
      convertInt(body.minimumQuantity),
      body.material || null
    ];

    const result = await query(sql, params);
    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      item: row.item,
      currentStockQuantity: row.current_stock_quantity,
      minimumQuantity: row.minimum_quantity,
      material: row.material,
      createdAt: row.created_at
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST stock error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 3. PUT - Update a stock record
export async function PUT(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Stock ID is required' }, { status: 400 });
    }

    const sql = `
      UPDATE stocks SET 
        item = $1, 
        current_stock_quantity = $2, 
        minimum_quantity = $3, 
        material = $4
      WHERE id = $5
      RETURNING *
    `;

    const params = [
      body.item || null,
      convertInt(body.currentStockQuantity),
      convertInt(body.minimumQuantity),
      body.material || null,
      body.id
    ];

    const result = await query(sql, params);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Stock record not found' }, { status: 404 });
    }
    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      item: row.item,
      currentStockQuantity: row.current_stock_quantity,
      minimumQuantity: row.minimum_quantity,
      material: row.material,
      createdAt: row.created_at
    });
  } catch (error: any) {
    console.error("PUT stock error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 4. DELETE - Delete a stock record
export async function DELETE(request: Request) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Stock ID is required' }, { status: 400 });
    }

    const result = await query('DELETE FROM stocks WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Stock record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error: any) {
    console.error("DELETE stock error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
