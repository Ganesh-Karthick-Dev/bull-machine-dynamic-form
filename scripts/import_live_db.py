import os
import pandas as pd
import psycopg2
from datetime import datetime

# Database credentials
db_config = {
    "host": "3.89.151.149",
    "port": 5432,
    "user": "postgres",
    "password": "postgres",
    "database": "bullmachine_DB"
}

def clean_date(val):
    if pd.isna(val) or val == "":
        return None
    try:
        # Handle datetime or timestamp types
        if isinstance(val, datetime) or hasattr(val, 'strftime'):
            return val.strftime('%Y-%m-%d')
        # Try parsing string format
        s = str(val).strip()
        if s.lower() in ["null", "none", ""]:
            return None
        # Try common Excel dates or format like DD/MM/YYYY
        for fmt in ('%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
            try:
                return datetime.strptime(s.split("T")[0].split(" ")[0], fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        return s
    except Exception:
        return None

def clean_int(val):
    if pd.isna(val) or val == "":
        return None
    try:
        return int(float(val))
    except Exception:
        return None

def clean_float(val):
    if pd.isna(val) or val == "":
        return 0.0
    try:
        return float(val)
    except Exception:
        return 0.0

def clean_string(val):
    if pd.isna(val) or val is None:
        return None
    return str(val).strip()

def main():
    print("Connecting to live database at 3.89.151.149...")
    conn = psycopg2.connect(**db_config)
    conn.autocommit = False
    cur = conn.cursor()
    print("Connected successfully!")
    
    # 1. Recreate tables
    print("Dropping tables...")
    cur.execute("DROP TABLE IF EXISTS overdue_orders CASCADE;")
    cur.execute("DROP TABLE IF EXISTS stocks CASCADE;")
    
    print("Creating overdue_orders table...")
    cur.execute("""
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
        );
    """)
    
    print("Creating stocks table...")
    cur.execute("""
        CREATE TABLE stocks (
            id SERIAL PRIMARY KEY,
            item TEXT NOT NULL,
            current_stock_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
            minimum_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
            material TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    print("Creating indexing...")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_overdue_orders_material ON overdue_orders(material);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_stocks_material ON stocks(material);")
    conn.commit()
    print("Tables and indexes successfully configured!")

    # 2. Parse and Insert POs
    po_path = os.path.join("doc", "bull machine - po.xlsx")
    print(f"Reading PO file from {po_path}...")
    po_df = pd.read_excel(po_path)
    print(f"Found {len(po_df)} rows in PO file.")
    
    po_sql = """
        INSERT INTO overdue_orders (
            plant, purchasing_group, material, mat_desc, vendor_code, vendor_name, 
            vendor_number, vendor_email, po_no, order_due_date, po_item_no, uom, 
            delivery_schedule_qty, pending_qty, despatch_date_supplier, delivery_date_bull, 
            asn_number, further_despatch_date, form_id, thanking_you_email, trigger_id, first_mail_sent
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    
    print("Importing PO rows...")
    po_count = 0
    for idx, row in po_df.iterrows():
        params = (
            clean_string(row.get('Plant')),
            clean_string(row.get('Purchasing Group')),
            clean_string(row.get('Material')),
            clean_string(row.get('Mat. Desc')),
            clean_string(row.get('Vendor Code')),
            clean_string(row.get('Vendor Name')),
            clean_string(row.get('vendor number')),
            clean_string(row.get('vendor email')),
            clean_string(row.get('PO No')),
            clean_date(row.get('Order Due Date')),
            clean_string(row.get('PO Item No')),
            clean_string(row.get('UOM')),
            clean_int(row.get('Delivery Schedule Quantity')),
            clean_int(row.get('Pending Qty')),
            clean_date(row.get('Despatch Date from Supplier')),
            clean_date(row.get('Delivery Date At Bull')),
            clean_string(row.get('If despatched means ASN Number')),
            clean_date(row.get('If not despatched means further despatch date')),
            clean_string(row.get('form id')),
            clean_string(row.get('thanking you email')),
            clean_string(row.get('trigger id')),
            clean_string(row.get('first mail sent'))
        )
        cur.execute(po_sql, params)
        po_count += 1
    
    conn.commit()
    print(f"Committed {po_count} overdue PO orders successfully!")

    # 3. Parse and Insert Stocks
    stocks_path = os.path.join("doc", "stocks - bull machine.xlsx")
    print(f"Reading Stocks file from {stocks_path}...")
    stocks_df = pd.read_excel(stocks_path)
    print(f"Found {len(stocks_df)} rows in Stocks file.")
    
    stocks_sql = """
        INSERT INTO stocks (item, current_stock_quantity, minimum_quantity, material)
        VALUES (%s, %s, %s, %s);
    """
    
    print("Importing Stock rows...")
    stocks_count = 0
    for idx, row in stocks_df.iterrows():
        params = (
            clean_string(row.get('item')),
            clean_float(row.get('currentStockQuantity')),
            clean_float(row.get('minimumQuantity')),
            clean_string(row.get('material'))
        )
        cur.execute(stocks_sql, params)
        stocks_count += 1
        
    conn.commit()
    print(f"Committed {stocks_count} stock items successfully!")

    # 4. Verify counts
    cur.execute("SELECT COUNT(*) FROM overdue_orders;")
    final_po_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM stocks;")
    final_stock_count = cur.fetchone()[0]
    
    print("\n--- DATABASE VERIFICATION DETAILS ---")
    print(f"Total Overdue Orders: {final_po_count}")
    print(f"Total Stock Materials: {final_stock_count}")
    print("--------------------------------------")
    
    cur.close()
    conn.close()
    print("Import completed successfully!")

if __name__ == "__main__":
    main()
