from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
import models, security

# Crear las tablas (si no existen)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración del puente CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Permite que React se conecte
    allow_credentials=True,
    allow_methods=["*"], # Permite todos los métodos (GET, POST, PUT, DELETE)
    allow_headers=["*"], # Permite todos los headers (incluyendo el Token)
)

# "Dependencia" para conectarnos a la base de datos de forma segura
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ProductoNuevo(BaseModel):
    barcode: str
    name: str
    category: str
    stock: int = 0
    min_stock: int = 5
    price: float = 0.0

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Buscar al usuario en la BD (OAuth2 usa 'username', pero nosotros le pasaremos el email)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # 2. Verificar que el usuario exista y la contraseña sea correcta
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Fabricar el token incluyendo el rol del usuario
    access_token = security.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    
    # 4. Entregar el pase VIP
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/inventario")
def obtener_inventario(
    db: Session = Depends(get_db), 
    current_user: dict = Depends(security.get_current_user)
):
    """Devuelve todo el inventario, pero SOLO si el usuario tiene un token válido"""
    
    # Si el código llega hasta aquí, significa que el token era válido.
    productos = db.query(models.Product).all()
    
    return {
        "usuario_actual": current_user, 
        "total_productos": len(productos),
        "productos": productos
    }

@app.post("/api/productos/proponer")
def proponer_producto(
    producto: ProductoNuevo, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(security.get_current_user)
):
    """Cualquier usuario logueado puede proponer un producto, pero nace como 'pendiente'"""
    
    # model_dump() convierte el molde a un diccionario de Python
    nuevo_producto = models.Product(**producto.model_dump(), status="pendiente")
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    
    return {"mensaje": "Producto propuesto, esperando aprobación de un supervisor", "producto": nuevo_producto}

@app.put("/api/productos/{producto_id}/aprobar")
def aprobar_producto(
    producto_id: int, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(security.require_supervisor) 
):
    """Solo Supervisores o Admins pueden cambiar el estado a 'aprobado'"""
    
    producto = db.query(models.Product).filter(models.Product.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado en el sistema")
        
    producto.status = "aprobado"
    db.commit()
    
    return {"mensaje": f"Producto '{producto.name}' aprobado exitosamente"}

@app.delete("/api/productos/{producto_id}")
def eliminar_producto(
    producto_id: int, 
    db: Session = Depends(get_db), 
    # El mismo guardia estricto que usamos para aprobar
    current_user: dict = Depends(security.require_supervisor) 
):
    """Elimina un producto de la base de datos de forma permanente"""
    
    producto = db.query(models.Product).filter(models.Product.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    db.delete(producto)
    db.commit()
    
    return {"mensaje": f"Producto eliminado exitosamente"}

@app.put("/api/productos/{producto_id}")
def actualizar_producto(
    producto_id: int, 
    producto_actualizado: ProductoNuevo, # Reutilizamos el molde que ya teníamos
    db: Session = Depends(get_db), 
    current_user: dict = Depends(security.require_supervisor) # Solo jefes editan
):
    """Actualiza todos los datos de un producto existente"""
    
    producto = db.query(models.Product).filter(models.Product.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    # Actualizamos los campos
    producto.barcode = producto_actualizado.barcode
    producto.name = producto_actualizado.name
    producto.category = producto_actualizado.category
    producto.price = producto_actualizado.price
    producto.stock = producto_actualizado.stock
    producto.min_stock = producto_actualizado.min_stock
    
    db.commit()
    db.refresh(producto)
    
    return {"mensaje": "Producto actualizado exitosamente", "producto": producto}