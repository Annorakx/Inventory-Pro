# Usamos una versión ligera de Python 3.12
FROM python:3.12-slim

# Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos la lista de dependencias y las instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el resto del código
COPY . .

# Exponemos el puerto de FastAPI
EXPOSE 8000

# Comando para encender el servidor permitiendo conexiones externas (0.0.0.0)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
