"""
FinTrack One-Click Supabase Setup & Connection Script

Run:
    python backend/setup_supabase.py "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
or simply:
    python backend/setup_supabase.py
"""

import os
import sys
import re

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def setup_supabase(db_url: str = None):
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    
    if not db_url:
        if len(sys.argv) > 1:
            db_url = sys.argv[1]
        else:
            print("\n🔑 Please paste your Supabase DATABASE_URL connection string below:")
            print("   Example: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n")
            try:
                db_url = input("DATABASE_URL: ").strip()
            except EOFError:
                print("❌ No input received.")
                return

    db_url = db_url.strip("'\"").strip()
    if not db_url.startswith(("postgresql://", "postgres://")):
        print("❌ Error: Invalid connection string. It must start with 'postgresql://' or 'postgres://'")
        return

    # Update backend/.env file
    print(f"\n📝 Updating backend/.env with your Supabase database URL...")
    env_content = ""
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        has_db_url = False
        new_lines = []
        for line in lines:
            if line.startswith("DATABASE_URL="):
                new_lines.append(f"DATABASE_URL={db_url}\n")
                has_db_url = True
            else:
                new_lines.append(line)
        if not has_db_url:
            new_lines.insert(0, f"DATABASE_URL={db_url}\n")
        env_content = "".join(new_lines)
    else:
        env_content = f"DATABASE_URL={db_url}\nJWT_SECRET_KEY=fintrack-super-secret-key-change-this-in-production\nENVIRONMENT=development\n"

    with open(env_path, "w", encoding="utf-8") as f:
        f.write(env_content)
    
    print("✅ Saved DATABASE_URL to backend/.env")

    # Reload settings
    os.environ["DATABASE_URL"] = db_url

    # Import app modules after env is set
    print("\n🔌 Testing connection to Supabase...")
    from app.config import settings
    from app.database import init_db, engine
    from sqlalchemy import text

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();")).fetchone()
            print(f"✅ Successfully connected to PostgreSQL / Supabase!\n   Version: {result[0] if result else 'OK'}")

        print("\n📦 Initializing tables in Supabase...")
        init_db()
        print("✅ Database schema initialized successfully.")

        # Migrate local data if fintrack.db exists
        sqlite_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fintrack.db")
        if os.path.exists(sqlite_db_path):
            print("\n🔄 Found local fintrack.db! Migrating data to Supabase...")
            from migrate_to_supabase import run_migration
            run_migration()
        else:
            print("\n🎉 Supabase connection setup complete!")

    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("\nPlease check that your database password in the DATABASE_URL is correct.")

if __name__ == "__main__":
    setup_supabase()
