# database/__init__.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, Registro

# Configuración de la base de datos
SQLALCHEMY_DATABASE_URL = "sqlite:///./seari.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

__all__ = ['SessionLocal', 'engine', 'Base', 'Registro']