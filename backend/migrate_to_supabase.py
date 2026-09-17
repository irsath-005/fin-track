"""
FinTrack SQLite to Supabase / PostgreSQL Migration Script

Usage:
    python migrate_to_supabase.py

Reads target DATABASE_URL from backend/.env and copies all data from local SQLite (fintrack.db)
to target PostgreSQL / Supabase instance.
"""

import os
import sys

# Ensure UTF-8 output encoding for Windows terminals
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.database import Base
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.investment import Investment
from app.models.budget import Budget
from app.models.goal import FinancialGoal

def run_migration():
    sqlite_url = "sqlite:///./fintrack.db"
    target_url = settings.sync_database_url

    if sqlite_url in target_url:
        print("❌ Error: Target DATABASE_URL in backend/.env is set to SQLite.")
        print("Please update backend/.env with your Supabase PostgreSQL DATABASE_URL first.")
        print("Example: DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres")
        sys.exit(1)

    print(f"🚀 Starting migration from SQLite ({sqlite_url}) -> Supabase/PostgreSQL...")

    # Engines and sessions
    src_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    dest_engine = create_engine(target_url, pool_pre_ping=True)

    SrcSession = sessionmaker(bind=src_engine)
    DestSession = sessionmaker(bind=dest_engine)

    src_db = SrcSession()
    dest_db = DestSession()

    try:
        # Create all tables in destination
        print("📦 Creating database tables in target database...")
        Base.metadata.create_all(bind=dest_engine)

        models = [User, Income, Expense, Investment, Budget, FinancialGoal]

        for model in models:
            table_name = model.__tablename__
            records = src_db.execute(select(model)).scalars().all()
            print(f"🔄 Migrating {len(records)} records for table: '{table_name}'...")

            for record in records:
                # Detach record attributes into dict
                data = {col.name: getattr(record, col.name) for col in record.__table__.columns}
                
                # Check if record already exists in dest
                existing = dest_db.query(model).filter(model.id == data["id"]).first()
                if not existing:
                    new_obj = model(**data)
                    dest_db.add(new_obj)

            dest_db.commit()
            print(f"✅ Table '{table_name}' migrated successfully.")

        # Reset sequences for PostgreSQL
        print("🔧 Resetting PostgreSQL primary key sequences...")
        with dest_engine.connect() as conn:
            for model in models:
                table_name = model.__tablename__
                try:
                    conn.execute(text(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE(MAX(id), 1)) FROM {table_name};"))
                    conn.commit()
                except Exception as seq_err:
                    print(f"   Notice resetting sequence for {table_name}: {seq_err}")

        print("\n🎉 Migration completed successfully! All data is now live on Supabase / PostgreSQL.")

    except Exception as e:
        dest_db.rollback()
        print(f"\n❌ Migration failed with error: {e}")
    finally:
        src_db.close()
        dest_db.close()

if __name__ == "__main__":
    run_migration()
