from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="operador") # Roles: operador, supervisor, admin

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=5) # Para las alertas de inventario
    price = Column(Float, default=0.0)
    status = Column(String, default="aprobado") # Estados: pendiente, aprobado

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)          # Quién lo hizo
    action = Column(String)                         # APROBACIÓN, EDICIÓN, ELIMINACIÓN
    product_name = Column(String)                   # Producto afectado
    details = Column(String)                        # Cambios específicos (ej: "Stock: 10 -> 50")
    timestamp = Column(DateTime, default=datetime.utcnow) # Cuándo ocurrió (UTC)