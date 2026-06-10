# Usamos una versión LTS moderna de Node.js
FROM node:20-alpine

# Carpeta de trabajo
WORKDIR /app

# Copiamos los archivos de configuración de dependencias
COPY package*.json ./

# Instalamos las librerías de React/Vite
RUN npm install

# Copiamos todo el código fuente
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Encendemos Vite permitiendo conexiones en red
CMD ["npm", "run", "dev", "--", "--host"]