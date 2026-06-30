import psycopg2

db_config = {
    "host": "3.89.151.149",
    "port": 5432,
    "user": "postgres",
    "password": "postgres",
    "database": "bullmachine_DB"
}

def main():
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM overdue_orders;")
    print("Overdue orders count:", cur.fetchone()[0])
    
    cur.execute("SELECT COUNT(*) FROM stocks;")
    print("Stocks count:", cur.fetchone()[0])
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
