# 🚀 EduNova - Guía de Despliegue con Docker Compose

Este repositorio contiene la configuración unificada (Monorepo) para compilar, empaquetar y desplegar tanto el Frontend como el Backend del microservicio de autenticación de **EduNova** utilizando **Docker** y **Docker Compose**.

---

## 🛠️ Estructura del Despliegue

El entorno de ejecución consta de dos contenedores principales comunicados de forma interna a través de una red virtual bridge de Docker:

| Contenedor | Puerto Expuesto | Tecnología / Imagen Base | Rol |
| :--- | :--- | :--- | :--- |
| **`vg-ms-auth`** | `8081:8081` | `eclipse-temurin:21-jre-alpine` | Microservicio de Autenticación (API REST) |
| **`vg-web-edunova`** | `4200:80` | `nginx:1.27-alpine` | Aplicación Angular (Frontend) + Proxy Nginx |

---

## 💻 Parte 1: Compilar y Subir Imágenes (PC de Desarrollo)

Si deseas realizar modificaciones, compilar tus propias imágenes locales y subirlas a tu cuenta de Docker Hub, sigue estos pasos:

### 1. Construir las imágenes locales
Ejecuta el siguiente comando en la raíz del proyecto para compilar el backend de Java y compilar la aplicación Angular en Nginx:
```bash
docker compose build
```

### 2. Iniciar sesión en Docker Hub
Inicia sesión con tus credenciales de Docker Hub:
```bash
docker login
```

### 3. Etiquetar las imágenes con tu usuario y versión
Etiqueta las imágenes locales compiladas con tu nombre de usuario y el tag de versión (ejemplo: `v1`):
```bash
docker tag repo-vg-ms-auth:v1 carloscaycho/vg-ms-auth:v1
docker tag repo-vg-web-edunova:v1 carloscaycho/vg-web-edunova:v1
```

### 4. Subir las imágenes a Docker Hub
Sube las imágenes etiquetadas a tu repositorio en la nube:
```bash
docker push carloscaycho/vg-ms-auth:v1
docker push carloscaycho/vg-web-edunova:v1
```

---

## 🚀 Parte 2: Ejecutar la Aplicación (Cualquier otra PC)

En la otra computadora **NO es necesario clonar este código fuente ni tener instalado Java o Node.js**. Únicamente requieres tener instalado **Docker** y seguir estos sencillos pasos:

### 1. Crear el archivo de configuración
Crea una carpeta vacía e introduce un archivo llamado `docker-compose.yml` con el siguiente contenido:

```yaml
services:
  vg-ms-auth:
    image: carloscaycho/vg-ms-auth:v1
    container_name: vg-ms-auth
    ports:
      - "8081:8081"
    environment:
      - PORT=8081
      - SPRING_R2DBC_URL=r2dbc:postgresql://neondb_owner:npg_Hh4Pxl6ZASRo@ep-red-river-amzz7klz-pooler.c-5.us-east-1.aws.neon.tech/vg-ms-auth?sslmode=require
      - SPRING_R2DBC_USERNAME=neondb_owner
      - SPRING_R2DBC_PASSWORD=npg_Hh4Pxl6ZASRo
      - SQL_INIT_MODE=never
      - SERVICES_ACADEMIC_URL=http://localhost:8082
      - SERVICES_STUDENT_URL=http://localhost:8083
      - JWT_SECRET=8c2NyL8aXGq6oOnfwdJlH/cl1hajrPDtBNmwGYYKCMk=
      - JWT_EXPIRATION=3600000
      - JWT_REFRESH_EXPIRATION=86400000
      - APP_FRONTEND_URL=http://localhost:4200
    networks:
      - edunova-network
    restart: unless-stopped

  vg-web-edunova:
    image: carloscaycho/vg-web-edunova:v1
    container_name: vg-web-edunova
    ports:
      - "4200:80"
    depends_on:
      - vg-ms-auth
    networks:
      - edunova-network
    restart: unless-stopped

networks:
  edunova-network:
    driver: bridge
```

### 2. Iniciar el entorno en segundo plano
Abre tu terminal dentro de la carpeta donde creaste el archivo `docker-compose.yml` y ejecuta:
```bash
docker compose up -d
```

### 3. ¡Disfrutar de la aplicación! 🎉
Abre tu navegador de preferencia e ingresa a:
👉 **[http://localhost:4200](http://localhost:4200)**

---

## ⚠️ Recomendación sobre otros Microservicios

> [!WARNING]
> La configuración actual de Nginx (`nginx.conf`) posee comentados los upstreams para servicios como `vg-ms-academic`, `vg-ms-student`, etc. Esto se hace para evitar que Nginx falle al iniciar si esos servidores no están presentes en la red de Docker. Si decides integrar más servicios, recuerda descomentarlos en `vg-web-edunova/nginx.conf` y agregarlos en este mismo archivo `docker-compose.yml`.
