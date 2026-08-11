# Etapa 1: build de Angular
# Utiliza una imagen de Node.js ligera para el proceso de construcción.
FROM node:20-alpine as build

# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copia los archivos de configuración de dependencias y los instala.
# Esto permite que Docker cachee esta capa si los archivos package*.json no cambian.
COPY package*.json ./
RUN npm install

# Copia el resto del código fuente de la aplicación Angular.
COPY . .

# Configuración de Angular con la que se compila. Por defecto producción, para
# que el build de siempre no cambie; el compose de staging pasa "staging" y así
# el bundle sale apuntando a la API de pruebas en vez de a la real.
ARG BUILD_CONFIGURATION=production

# Ejecuta el build de Angular. El doble guion es necesario para que los flags
# lleguen a "ng" y no se los coma npm.
RUN npm run build -- --configuration=$BUILD_CONFIGURATION

# Etapa 2: servidor Nginx para servir Angular
# Utiliza una imagen de Nginx ligera para servir los archivos estáticos.
FROM nginx:alpine

# Copia los archivos construidos de Angular desde la etapa 'build'
# al directorio de servicio de Nginx.
# Asegúrate de que la ruta '/app/dist/cirsubfrontend' coincida con la salida de tu build.
COPY --from=build /app/dist/cirsubfrontend/browser /usr/share/nginx/html

# Copia una configuración de Nginx personalizada.
# Esta configuración es crucial para el enrutamiento de aplicaciones de una sola página (SPA).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80, que es el puerto por defecto de Nginx.
EXPOSE 80

# Comando para iniciar Nginx en primer plano, lo cual es necesario para Docker.
CMD ["nginx", "-g", "daemon off;"]
