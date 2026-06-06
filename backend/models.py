from sqlalchemy import Column, Integer, String, Float
from database import Base

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