from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
import models, security
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import BackgroundTasks  # <-- Importante para el segundo plano
import os

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
    
    # 4. Entregar el Token
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

    # REGISTRO EN BITÁCORA
    registrar_auditoria(
        db, 
        username=current_user["email"], 
        action="APROBACIÓN", 
        product_name=producto.name, 
        details="Estado cambiado de PENDIENTE a APROBADO"
    )
    
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
    
    # GUARDAMOS EL NOMBRE ANTES DE DESTRUIRLO
    producto_nombre = producto.name
        
    db.delete(producto)
    db.commit()

    # REGISTRO EN BITÁCORA
    registrar_auditoria(
        db, 
        username=current_user["email"], 
        action="ELIMINACIÓN", 
        product_name=producto_nombre, 
        details="Producto removido permanentemente de la base de datos"
    )
    
    return {"mensaje": f"Producto eliminado exitosamente"}

@app.put("/api/productos/{producto_id}")
def actualizar_producto(
    producto_id: int,
    producto_actualizado: ProductoNuevo,
    background_tasks: BackgroundTasks,  # <-- NUEVO PARÁMETRO AQUÍ
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.require_supervisor)
):
    """Actualiza todos los datos de un producto existente y evalúa el stock crítico"""
    
    producto = db.query(models.Product).filter(models.Product.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    detalles_cambio = f"Precio: ${producto.price} -> ${producto_actualizado.price} | Stock: {producto.stock} -> {producto_actualizado.stock}"
    
    # Aplicamos los cambios en el modelo
    producto.barcode = producto_actualizado.barcode
    producto.name = producto_actualizado.name
    producto.category = producto_actualizado.category
    producto.price = producto_actualizado.price
    producto.stock = producto_actualizado.stock
    producto.min_stock = producto_actualizado.min_stock
    
    db.commit()
    db.refresh(producto)
    
    # 1. REGISTRO EN BITÁCORA
    registrar_auditoria(
        db, 
        username=current_user["email"], 
        action="EDICIÓN", 
        product_name=producto.name, 
        details=detalles_cambio
    )
    
    # 2. EVALUACIÓN DEL CENTINELA: ¿El nuevo stock está en nivel crítico?
    if producto.stock <= producto.min_stock:
        # Añadimos la tarea al background_tasks para que se ejecute en hilos separados
        background_tasks.add_task(
            enviar_correo_alerta, 
            producto_name=producto.name, 
            stock_actual=producto.stock, 
            min_stock=producto.min_stock
        )
    
    return {"mensaje": "Producto actualizado exitosamente", "producto": producto}

def registrar_auditoria(db: Session, username: str, action: str, product_name: str, details: str):
    """Inserta de forma automática un registro de auditoría en la base de datos"""
    log_entry = models.AuditLog(
        username=username,
        action=action,
        product_name=product_name,
        details=details
    )
    db.add(log_entry)
    db.commit()

@app.get("/api/auditoria")
def obtener_logs_auditoria(
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.require_supervisor) # Restringido a Admin
):
    """Retorna el historial completo de la bitácora ordenado del más reciente al más antiguo"""
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()
    return {"logs": logs}

def enviar_correo_alerta(producto_name: str, stock_actual: int, min_stock: int):
    """Construye y envía el correo electrónico de alerta por stock crítico"""
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_destino = os.getenv("EMAIL_ALERTA_DESTINO")

    # Si falta alguna credencial, cancelamos silenciosamente para no romper el flujo
    if not all([smtp_user, smtp_password, email_destino]):
        print("⚠️ Alerta de correo omitida: Credenciales SMTP incompletas en el archivo .env")
        return

    # Estructura del mensaje
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = email_destino
    msg['Subject'] = f"🚨 ALERTA DE STOCK CRÍTICO: {producto_name}"

    cuerpo_mensaje = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="background-color: #fff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; border-top: 4px solid #ef4444;">
                <h2 style="color: #b91c1c; margin-top: 0;">¡Inventario Crítico Detectado!</h2>
                <p>El sistema <strong>Inventory Pro</strong> ha registrado un movimiento que deja el siguiente artículo por debajo del umbral mínimo permitido:</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p><strong>Producto:</strong> {producto_name}</p>
                <p><strong>Stock Actual:</strong> <span style="color: #ef4444; font-weight: bold;">{stock_actual} unidades</span></p>
                <p><strong>Stock Mínimo Permitido:</strong> {min_stock} unidades</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 12px; color: #6b7280;">Este es un correo automático generado por Inventory Pro de forma segura.</p>
            </div>
        </body>
    </html>
    """
    
    msg.attach(MIMEText(cuerpo_mensaje, 'html'))

    try:
        # Conexión segura al servidor SMTP
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Cifrado TLS
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, email_destino, msg.as_string())
        server.quit()
        print(f"📧 Alerta de correo enviada con éxito para el producto: {producto_name}")
    except Exception as e:
        print(f"❌ Error al intentar enviar el correo de alerta: {e}")