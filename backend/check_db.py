from app.database import engine
from sqlalchemy import inspect, text

def inspect_database():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("================ DATABASE INSPECTION REPORT ================")
    print(f"Database File: fintrack.db")
    print(f"Total Tables Found: {len(tables)}\n")

    with engine.connect() as conn:
        for table in tables:
            count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            columns = [c["name"] for c in inspector.get_columns(table)]
            print(f"Table: [{table}]")
            print(f"   - Total Rows: {count}")
            print(f"   - Columns: {', '.join(columns)}")
            
            # Print sample rows if data exists
            if count > 0:
                rows = conn.execute(text(f"SELECT * FROM {table} LIMIT 3")).mappings().all()
                print("   - Sample Records:")
                for r in rows:
                    dict_row = dict(r)
                    # Mask password hash for privacy/clean display
                    if "password_hash" in dict_row:
                        dict_row["password_hash"] = "***HASHED***"
                    print(f"     -> {dict_row}")
            print()
    print("============================================================")

if __name__ == "__main__":
    inspect_database()
