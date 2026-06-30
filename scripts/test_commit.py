import psycopg2
import time

db_config = {
    "host": "3.89.151.149",
    "port": 5432,
    "user": "postgres",
    "password": "postgres",
    "database": "bullmachine_DB"
}

def main():
    print("Connecting for insert...")
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    # We will NOT drop the table, just insert
    cur.execute("""
        INSERT INTO overdue_orders (po_no, plant, material, pending_qty)
        VALUES ('TEST_1', 'TEST', 'TEST_MAT', 10);
    """)
    conn.commit()
    print("Inserted and committed TEST_1.")
    
    cur.close()
    conn.close()
    
    print("Waiting 3 seconds...")
    time.sleep(3)
    
    print("Connecting for count...")
    conn2 = psycopg2.connect(**db_config)
    cur2 = conn2.cursor()
    cur2.execute("SELECT COUNT(*), MAX(id) FROM overdue_orders;")
    count, max_id = cur2.fetchone()
    print(f"Count: {count}, Max ID: {max_id}")
    
    cur2.close()
    conn2.close()

if __name__ == "__main__":
    main()
