---
description: Backend reactivo con Spring WebFlux, R2DBC y PostgreSQL para gestión multiinstitución, autenticación JWT segura, control de permisos, auditoría completa y administración escalable de usuarios, roles y configuraciones institucionales.
---

# Reactive Backend Workflow

## Objetivo

Desarrollar la lógica backend reactiva completa utilizando Spring WebFlux + R2DBC + PostgreSQL para gestión multiinstitución, autenticación JWT, control RBAC, auditoría avanzada y administración reactiva de usuarios, roles, permisos e instituciones.

## Reglas Obligatorias

- Mantener estrictamente el estándar actual de carpetas y arquitectura existente.
- No modificar estructura base, naming conventions, organización modular ni flujo actual del proyecto.
- Toda implementación debe integrarse respetando los patrones ya definidos.
- No crear nuevas arquitecturas paralelas ni reorganizar packages existentes.
- Mantener consistencia con DTOs, responses, exceptions, mappers y convenciones actuales.

---

# Backend Workflow

```mermaid
flowchart TD

A[Reactive Controllers] --> B[Reactive Services]

B --> C[Security Layer]

C --> D[Business Rules]

D --> E[Reactive Repository Layer]

E --> F[(PostgreSQL)]

%% Controllers
A --> A1[AuthController]
A --> A2[UsuarioController]
A --> A3[RolController]
A --> A4[InstitucionController]
A --> A5[ConfiguracionController]
A --> A6[AuditoriaController]

%% Services
B --> B1[AuthService]
B --> B2[UsuarioService]
B --> B3[RolService]
B --> B4[PermisoService]
B --> B5[InstitucionService]
B --> B6[ConfiguracionService]
B --> B7[TokenService]
B --> B8[AuditService]

%% Security
C --> C1[JWT Authentication]
C --> C2[Refresh Token Rotation]
C --> C3[RBAC Authorization]
C --> C4[Reactive Security Context]
C --> C5[Password Encryption]
C --> C6[JWT Blocklist]
C --> C7[Login Attempt Protection]

%% Business Rules
D --> D1[Gestion Multiinstitucion]
D --> D2[Asignacion de Roles]
D --> D3[Control de Permisos]
D --> D4[Validaciones Reactivas]
D --> D5[Verificacion de Email]
D --> D6[Recuperacion de Password]
D --> D7[Auditoria Automatica]

%% Repository
E --> E1[UsuarioRepository]
E --> E2[RolRepository]
E --> E3[PermisoRepository]
E --> E4[InstitucionRepository]
E --> E5[ConfiguracionRepository]
E --> E6[TokenRepository]
E --> E7[AuditRepository]

%% Database
F --> F1[instituciones]
F --> F2[configuracion_institucion]
F --> F3[usuarios]
F --> F4[roles]
F --> F5[permisos]
F --> F6[usuario_roles]
F --> F7[rol_permisos]
F --> F8[tokens_seguridad]
F --> F9[refresh_tokens]
F --> F10[jwt_blocklist]
F --> F11[audit_log]
```

---

# Lógica Backend Requerida

## Instituciones

- CRUD reactivo completo.
- Validar unicidad:
  - uuid
  - nombre
  - codigo_modular
- Manejo de:
  - activa
  - logo_url
  - emails secundarios
  - teléfonos secundarios
- Actualización automática de timestamps.
- Registro automático en auditoría.

---

## Configuración Institucional

- Relación única por institución.
- Validar:
  - colores HEX
  - horarios válidos
  - moneda ISO
  - rangos permitidos
- Gestión reactiva de configuraciones académicas y visuales.

---

## Usuarios

- Registro reactivo de usuarios.
- Hash seguro de contraseñas.
- Email único por institución.
- Manejo de estados:
  - activo
  - inactivo
  - suspendido
  - pendiente
- Gestión de:
  - email_verificado
  - requiere_cambio_pwd
  - intentos_fallidos
  - bloqueado_hasta
  - ultimo_acceso
- Bloqueo automático por intentos fallidos.

---

## Roles y Permisos

- CRUD reactivo de roles.
- Protección de roles del sistema.
- Asignación:
  - usuario ↔ roles
  - rol ↔ permisos
- Validación RBAC reactiva por módulo y acción.

---

## Seguridad

### JWT

- Generación de access token.
- Validación reactiva.
- Manejo de JTI.
- Invalidación mediante blocklist.

### Refresh Tokens

- Rotación de tokens.
- Revocación reactiva.
- Manejo de familias de tokens.
- Registro de IP y user-agent.

### Tokens de Seguridad

Implementar:

- recuperación de contraseña
- verificación de email
- invitaciones

Validar:

- expiración
- reutilización
- uso único

---

## Auditoría

Registrar automáticamente:

- INSERT
- UPDATE
- DELETE
- LOGIN
- LOGOUT
- LOGIN_FAILED

Guardar:

- usuario
- tabla
- registro
- IP origen
- user agent
- datos anteriores
- datos nuevos

Usar JSONB para trazabilidad completa.

---

# Stack Técnico

- Java 21
- Spring Boot 3
- Spring WebFlux
- Spring Security Reactive
- R2DBC PostgreSQL
- Project Reactor
- JWT Authentication
- Reactive Validation
- Global Exception Handling
- Arquitectura no bloqueante

```

```
