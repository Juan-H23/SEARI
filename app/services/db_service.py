from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import Base

DATABASE_URL = "sqlite:///data/seari.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)

# Crea las tablas si no existen
Base.metadata.create_all(bind=engine)
