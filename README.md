# Inventory Pro v1.3 🚀

Sistema Integral de Gestión de Inventario con Arquitectura Full-Stack, Control de Acceso Basado en Roles (RBAC) e Inteligencia Visual.

Un ecosistema web moderno y desacoplado diseñado bajo rigurosos estándares de ingeniería de software para optimizar procesos administrativos, garantizar la consistencia de los datos en entornos concurrentes y auditar operaciones críticas en tiempo real.

---

## 🌟 Características Principales

### 🔄 Control Total de Activos (CRUD)

- **Gestión Integral:** Capacidades completas para Crear, Leer, Actualizar y Eliminar registros de productos.
- **Radar de Datos:** Filtrado iterativo complejo y búsquedas en tiempo real procesadas directamente en memoria en la capa del cliente, reduciendo la latencia y la carga en el servidor.
- **Alertas de Umbral:** Identificación visual automática e instantánea de productos con existencias por debajo del límite mínimo establecido (`stock <= min_stock`).

### 🛡️ Seguridad y Control de Acceso (RBAC)

- **Autenticación Stateless:** Control de sesiones mediante tokens criptográficos JWT inyectados en las cabeceras HTTP.
- **Jerarquía de Roles Estricta:**
  - **Operador:** Permisos exclusivos de lectura y propuesta de inserción.
  - **Administrador:** Autoridad total para mutar datos y resolver aprobaciones.
- **Defensa en Profundidad:** Rutas protegidas en el frontend e intercepción mediante middleware asíncrono en FastAPI.

### 📊 Inteligencia Visual y Auditoría

- **Centro de Mando Dinámico:** Gráficos interactivos de alto impacto construidos con **Recharts**.
- **Bitácora de Trazabilidad:** Registro inmutable de auditoría (Quién, Qué, Cuándo).
- **Exportación CSV:** Generación dinámica de reportes estructurados compatibles con Excel.

---

## 🛠️ Stack Tecnológico

- **Backend:** Python 3.12, FastAPI, SQLAlchemy ORM, SQLite.
- **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide React.
- **Entorno:** Linux Nativo.

---

## 🚀 Instrucciones de Instalación Local

### 1. Clonar el Repositorio

```bash
git clone [https://github.com/tu-usuario/Inventory-Pro.git](https://github.com/tu-usuario/Inventory-Pro.git)
cd Inventory-Pro
```

### 2. Configuración del Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic pyjwt passlib[bcrypt]
uvicorn main:app --reload
```

### 3. Configuración del Frontend (React + Vite)

```bash
cd frontend
npm install
npm install recharts lucide-react react-router-dom
npm run dev
```
