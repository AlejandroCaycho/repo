# Microservicio de Autenticacion y Autorizacion

Microservicio reactivo desarrollado con Spring WebFlux, R2DBC y PostgreSQL para la gestion centralizada de identidades, control de acceso e instituciones del sistema.

## Arquitectura y Stack Tecnologico

- Spring Boot 3.4.5 y Java 21
- Spring WebFlux (Programacion Reactiva)
- Spring Security (Seguridad Web Reactiva)
- R2DBC con PostgreSQL (Acceso reactivo a datos)
- JSON Web Token (JWT) y Refresh Token
- Lombok y MapStruct

## Variables de Entorno

Crear un archivo .env en la raiz con la siguiente configuracion:

```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vg_auth
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=tu_clave_secreta_super_segura_de_al_menos_256_bits_aqui
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=86400
SQL_INIT_MODE=always
```

## Inicializacion de Base de Datos

El microservicio realiza la creacion de tablas, indices, insercion de roles predefinidos del colegio y mapeos de permisos de forma automatica en su primera ejecucion.

1. **Primera ejecucion:** Configurar la variable en always para levantar el esquema y sembrar la informacion inicial de la base de datos:
```env
SQL_INIT_MODE=always
```

2. **Ejecuciones posteriores:** Para mantener la consistencia de los datos, evitar re-ejecuciones de scripts innecesarias y optimizar la velocidad de arranque, es una buena practica cambiar el valor de la variable a never:
```env
SQL_INIT_MODE=never
```

## Arquitectura de Seguridad (RBAC y PBAC)

El microservicio utiliza un modelo hibrido de control de acceso basado en roles y permisos cargados directamente en el token JWT.

### Roles Predefinidos del Sistema

| Nombre | Descripcion | Alcance |
|---|---|---|
| SUPERROOT | Super Administrador | Control total del sistema e instituciones |
| ADMIN | Administrador de Institucion | Gestion de configuracion, roles y usuarios locales |
| DIRECTOR | Director del Colegio | Gestion de configuracion, roles y usuarios locales |
| TUTOR | Tutor de Aula | Lectura de usuarios de su institucion |
| PROFESOR | Profesor / Docente | Lectura de usuarios de su institucion |
| AUXILIAR | Auxiliar de Educacion | Lectura de usuarios de su institucion |
| PADRE_DE_FAMILIA | Apoderado | Lectura de usuarios de su institucion |
| PSICOLOGIA | Psicologo | Lectura de usuarios de su institucion |

### Modulos y Permisos del Sistema

- INSTITUCIONES: CREATE, READ, UPDATE, DELETE
- CONFIGURACION: CREATE, READ, UPDATE, DELETE
- ROLES: CREATE, READ, UPDATE, DELETE
- PERMISOS: CREATE, READ, UPDATE, DELETE
- USUARIOS: CREATE, READ, UPDATE, DELETE
- AUDIT: READ

## Auditoria Automatizada (AuditLog)

Toda mutacion de datos (INSERT, UPDATE, DELETE) en cualquiera de las siguientes entidades del sistema genera un registro automatico en la tabla audit_log con instantaneas de los datos anteriores y nuevos:

- instituciones
- configuracion_institucion
- roles
- permisos
- usuarios
- usuario_roles
- rol_permisos

## Guia de Endpoints de la API

La base URL de los endpoints es /api/v1.

### Autenticacion (/auth)

- POST /auth/login: Autenticacion de usuario. Retorna tokens de acceso y refresh.
- POST /auth/register: Registro de nuevos usuarios institucionales.
- POST /auth/refresh: Renovacion del token de acceso expirado usando el refresh token.
- POST /auth/forgot-password: Solicitud de recuperacion de contrasena por correo.
- POST /auth/reset-password: Reestablecimiento de contrasena usando el token enviado.
- POST /auth/change-password: Cambio seguro de contrasena.
- POST /auth/logout: Cierre de sesion e invalidacion del token en blocklist.

### Instituciones (/instituciones)

- POST /instituciones: Registrar una institucion.
- GET /instituciones: Listar instituciones activas.
- GET /instituciones/todas: Listar todas las instituciones registradas.
- GET /instituciones/{id}: Buscar institucion por ID.
- GET /instituciones/uuid/{uuid}: Buscar institucion por UUID.
- PUT /instituciones/{id}: Actualizar institucion.
- PATCH /instituciones/{id}/desactivar: Desactivar institucion.
- PATCH /instituciones/{id}/activar: Activar institucion.
- DELETE /instituciones/{id}: Eliminacion fisica de institucion.

### Configuracion de Institucion (/configuraciones-institucion)

- POST /configuraciones-institucion: Crear configuracion.
- GET /configuraciones-institucion: Listar configuraciones.
- GET /configuraciones-institucion/institucion/{institucionId}: Buscar por institucion.
- PUT /configuraciones-institucion/institucion/{institucionId}: Actualizar configuracion.
- DELETE /configuraciones-institucion/institucion/{institucionId}: Eliminar configuracion.

### Roles y Permisos (/roles, /permisos, /usuario-roles)

- GET /roles: Listar todos los roles.
- POST /roles: Crear rol personalizado.
- GET /permisos: Listar permisos.
- POST /permisos/asignar: Asignar permisos a un rol.
- POST /permisos/quitar: Quitar permisos de un rol.
- POST /usuario-roles/asignar: Asignar rol a un usuario.
- POST /usuario-roles/quitar: Quitar rol de un usuario.

### Auditoria (/audit-log)

- GET /audit-log: Listar todos los logs de auditoria.
- GET /audit-log/usuario/{usuarioId}: Filtrar logs por usuario.
- GET /audit-log/tabla/{tabla}: Filtrar logs por tabla.
- GET /audit-log/tabla/{tabla}/registro/{registroId}: Filtrar logs por registro especifico.

## Compilacion y Ejecucion

### Compilar el proyecto

```bash
mvn clean package -DskipTests
```

### Ejecutar de forma local

```bash
mvn spring-boot:run
```

### Inicializacion de Base de Datos para Desarrollo

Para facilitar el primer inicio y configuracion, puedes inicializar el sistema llamando al siguiente endpoint de desarrollo:

```bash
POST /api/v1/dev/seed
```

Este endpoint inicializa la base de datos creando la institucion base del sistema, mapea el rol SUPERROOT y crea el primer usuario administrador global con credenciales admin@vallegrande.edu.pe y contraseña Admin2024!. Solo funciona si la base de datos de usuarios esta vacia.
