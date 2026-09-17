from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Configure engine with connect_args for SQLite if applicable
connect_args = {}
if settings.sync_database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.sync_database_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import app.models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)

    # Lightweight auto-migration for missing columns on existing SQLite DBs
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "users" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("users")]
            with engine.connect() as conn:
                if "otp_code" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN otp_code VARCHAR(10)"))
                if "otp_expires_at" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP"))
                conn.commit()
    except Exception as e:
        print(f"Migration notice: {e}")

