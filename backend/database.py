"""
database.py
------------
Sets up a local SQLite database (app.db) using SQLAlchemy.
This is what makes student progress, quiz history, and uploaded
document records PERSIST across restarts — instead of being
hardcoded in the frontend like the earlier demo version.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: gives each request its own DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
