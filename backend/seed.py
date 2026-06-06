from database import SessionLocal
import models
from passlib.context import CryptContext

# Usamos la librería passlib que instalamos en el Nivel 1 para encriptar las contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def crear_datos_de_prueba():
    db = SessionLocal()
    
    # 1. Verificar si ya hay datos para no duplicarlos
    if db.query(models.User).first():
        print("La base de datos ya contiene datos de prueba.")
        db.close()
        return

    print("Inyectando usuarios...")
    # 2. Crear usuarios con contraseñas encriptadas y diferentes roles
    usuarios = [
        models.User(email="admin@sistema.com", hashed_password=pwd_context.hash("admin123"), role="admin"),
        models.User(email="supervisor@sistema.com", hashed_password=pwd_context.hash("super123"), role="supervisor"),
        models.User(email="operador@sistema.com", hashed_password=pwd_context.hash("caja123"), role="operador"),
    ]
    db.add_all(usuarios)
    
    print("Inyectando productos...")
    # 3. Crear productos (algunos con bajo stock y uno pendiente de aprobación)
    productos = [
        models.Product(
            barcode="7501000111223", name="Refresco de Cola 1.5L", 
            category="Bebidas", stock=25, min_stock=5, price=2.50, status="aprobado"
        ),
        models.Product(
            barcode="7501000333445", name="Papas Fritas Originales", 
            category="Snacks", stock=3, min_stock=10, price=1.80, status="aprobado"
        ), # <--- Este va a disparar la Alerta de Stock Mínimo
        models.Product(
            barcode="7501000555667", name="Detergente Líquido 1L", 
            category="Limpieza", stock=12, min_stock=4, price=5.20, status="aprobado"
        ),
        models.Product(
            barcode="7501000777889", name="Chocolate con Almendras", 
            category="Snacks", stock=10, min_stock=5, price=1.50, status="pendiente"
        ), # <--- Este simula el flujo de aprobación del operador
    ]
    db.add_all(productos)
    
    # Guardar cambios en el archivo inventario.db
    db.commit()
    db.close()
    print("¡Misión cumplida! Datos de prueba inyectados con éxito.")

if __name__ == "__main__":
    crear_datos_de_prueba()