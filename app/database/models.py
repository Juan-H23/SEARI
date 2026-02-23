from sqlalchemy import Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Registro(Base):
    __tablename__ = "registros"

    id = Column(Integer, primary_key=True, index=True)
    concepto = Column(String, index=True)
    valor = Column(Float)
    fecha = Column(Date)
    tipo = Column(String)  # NUEVO: ingreso o egreso
