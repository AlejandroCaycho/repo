# Documentación de Domain-Driven Design (DDD)

## Arquitectura Hexagonal / DDD

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  (Handlers HTTP, DTOs, configuration de Spring)            │
│                                                             │
│  web/handler/   web/router/   config/   dto/   mapper/     │
├─────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                           │
│  (Entidades, Value Objects, Domain Events, Servicios)      │
│                                                             │
│  domain/model/   domain/valueobject/   domain/event/       │
│  domain/service (interfaces)                                │
│                                                             │
│  Puerto: DomainService, DomainEventPublisher, Repository    │
├─────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                      │
│  (Adaptadores: DB, email, seguridad, HTTP routing)         │
│                                                             │
│  service/impl/   repository/   security/   infrastructure/ │
│  exception/   web/router/                                   │
└─────────────────────────────────────────────────────────────┘
```

## Tactical Patterns Implementados

### Aggregate Roots

Marcan la raíz de un agregado. Solo se permite acceso al interior del agregado a través de su Aggregate Root.

| Aggregate Root | Entidades internas | Archivo |
|---|---|---|
| `Usuario` | RefreshToken, TokenSeguridad, JwtBlocklist, UsuarioRol | `domain/model/Usuario.java` |
| `Rol` | RolPermiso | `domain/model/Rol.java` |
| `Institucion` | ConfiguracionInstitucion | `domain/model/Institucion.java` |

### Entities

Objetos con identidad continua (definida por su ID, no por atributos).

- `Usuario`, `Institucion`, `Rol`, `Permiso` — Aggregate Roots que implementan `AggregateRoot`
- `RefreshToken`, `TokenSeguridad`, `JwtBlocklist` — entidades internas del agregado Usuario
- `RolPermiso` — entidad interna del agregado Rol (join table)
- `UsuarioRol` — entidad interna del agregado Usuario (join table)
- `AuditLog` — log de eventos de auditoría
- `ConfiguracionInstitucion` — configuración específica de institución

Marcador: `domain/AggregateRoot.java`, `domain/Entity.java`

### Value Objects

Inmutables, auto-validables, igualdad por valor. Encapsulan reglas de negocio.

| Value Object | Validación | Comportamiento |
|---|---|---|
| `Email` | Formato regex + normalización lowercase | `dominio()`, `usuario()` |
| `ContrasenaHash` | Prefijo BCrypt ($2a$, $2b$, $2y$) | Validación de formato hash |
| `Telefono` | 7-15 dígitos, opcional + | `isPresent()` |
| `Url` | Formato http/https, max 2000 chars | `isPresent()` |
| `ColorHex` | Formato #RRGGBB | Normalización uppercase |
| `Moneda` | Código ISO 4217 vía `java.util.Currency` | `simbolo()` |
| `RangoCalificacion` | Valor entre 0 y 20 | `esAprobatoria()`, `esBaja()` |
| `Horario` | Fin posterior a inicio | `estaDentroDe()`, `duracionEnMinutos()` |
| `EstadoUsuario` | activo/inactivo/bloqueado/pendiente | `permiteLogin()`, `puedeDesactivar()`, `puedeActivar()` |

Ubicación: `domain/valueobject/*.java`

### Domain Events

Eventos inmutables que representan algo que ocurrió en el dominio.

| Evento | Disparado por | Datos |
|---|---|---|
| `UsuarioRegistradoEvent` | `AuthServiceImpl.register()` | usuarioId, email, nombre, institucionId, rolAsignado |
| `RolAsignadoEvent` | `AuthServiceImpl.register()` | usuarioId, rolId, nombreRol, asignadoPor |
| `LoginFallidoEvent` | `AuthServiceImpl.login()` | email, usuarioId, motivo, intentosFallidos, limiteIntentos |

- Interfaz base: `domain/event/DomainEvent.java`
- Puerto: `domain/event/DomainEventPublisher.java`
- Adaptador: `infrastructure/event/SpringDomainEventPublisher.java`
- Listener: `infrastructure/event/DomainEventListener.java`

### Domain Services

Lógica de negocio que no pertenece naturalmente a una entidad o Value Object.

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Login, registro, refresh token, forgot/reset password |
| `UsuarioService` | CRUD, activación/desactivación, foto de perfil |
| `RolService` | CRUD, protección de roles de sistema |
| `PermisoService` | CRUD, asignación de permisos a roles |
| `InstitucionService` | CRUD, activación/desactivación |
| `UsuarioRolService` | Asignación de roles |
| `ConfiguracionInstitucionService` | Configuración por institución |
| `AuditLogService` | Registro y consulta de auditoría |
| `EmailService` | Envío de correos (contraseña olvidada) |

### Repositories (Puertos)

Interfaces de persistencia definidas como puertos en la capa de dominio. Spring Data R2DBC es el adaptador de infraestructura.

| Repository | Aggregate Root |
|---|---|
| `UsuarioRepository` | Usuario |
| `RolRepository` | Rol |
| `PermisoRepository` | Permiso |
| `InstitucionRepository` | Institucion |
| `RefreshTokenRepository` | RefreshToken (interno de Usuario) |
| `TokenSeguridadRepository` | TokenSeguridad (interno de Usuario) |
| `JwtBlocklistRepository` | JwtBlocklist (interno de Usuario) |
| `AuditLogRepository` | AuditLog |
| `RolPermisoRepository` | RolPermiso (join) |
| `UsuarioRolRepository` | UsuarioRol (join) |
| `ConfiguracionInstitucionRepository` | ConfiguracionInstitucion (interno de Institucion) |

## Comportamiento de Entidades (Rich Domain Model)

Las entidades contienen métodos de negocio que encapsulan reglas del dominio:

**Usuario:**
- `incrementarIntentosFallidos()` → incrementa contador, bloquea si excede límite
- `bloquear(OffsetDateTime hasta)` → cambia estado a "bloqueado"
- `desbloquear()` → cambia estado a "activo", resetea contador
- `bloqueoExpiro(OffsetDateTime now)` → verifica si el bloqueo expiró
- `reiniciarIntentosFallidos()` → resetea contador a 0
- `registrarAcceso(OffsetDateTime)` → actualiza último acceso

**Institucion:**
- `estaActiva()` → verifica si la institución está activa
- `activar()` → marca como activa
- `desactivar()` → marca como inactiva

**Rol:**
- `esSistema()` → verifica si es rol de sistema (no modificable)

**RefreshToken:**
- `expirado(OffsetDateTime)` → verifica expiración
- `revocar(String nuevoToken)` → revoca y guarda el reemplazo

**TokenSeguridad:**
- `esValido(OffsetDateTime)` → verifica expiración y estado "usado"
- `marcarUsado()` → marca como usado

## Mapa de Archivos por Capa DDD

```
src/main/java/com/vg/auth/
│
├── VgMsAuthApplication.java              # Application entry point
│
├── domain/                               # DOMAIN LAYER
│   ├── AggregateRoot.java                # Marker interface
│   ├── Entity.java                       # Marker interface
│   ├── model/                            # Entities y modelos
│   │   ├── Usuario.java                  # Aggregate Root
│   │   ├── Institucion.java              # Aggregate Root
│   │   ├── Rol.java                      # Aggregate Root
│   │   ├── Permiso.java                  # Entity
│   │   ├── RefreshToken.java             # Entity (interna)
│   │   ├── TokenSeguridad.java           # Entity (interna)
│   │   ├── JwtBlocklist.java             # Entity (interna)
│   │   ├── AuditLog.java                 # Entity
│   │   ├── ConfiguracionInstitucion.java # Entity (interna)
│   │   ├── RolPermiso.java               # Entity (interna)
│   │   └── UsuarioRol.java               # Entity (interna)
│   ├── valueobject/                      # Value Objects
│   │   ├── Email.java
│   │   ├── ContrasenaHash.java
│   │   ├── Telefono.java
│   │   ├── Url.java
│   │   ├── ColorHex.java
│   │   ├── Moneda.java
│   │   ├── RangoCalificacion.java
│   │   ├── Horario.java
│   │   └── EstadoUsuario.java
│   └── event/                            # Domain Events
│       ├── DomainEvent.java              # Interface base
│       ├── DomainEventPublisher.java     # Puerto
│       ├── UsuarioRegistradoEvent.java
│       ├── RolAsignadoEvent.java
│       └── LoginFallidoEvent.java
│
├── service/                              # Domain Services (puertos)
│   ├── AuthService.java
│   ├── UsuarioService.java
│   ├── RolService.java
│   ├── PermisoService.java
│   ├── InstitucionService.java
│   ├── UsuarioRolService.java
│   ├── ConfiguracionInstitucionService.java
│   ├── AuditLogService.java
│   ├── EmailService.java
│   └── impl/                             # Implementaciones
│       ├── AuthServiceImpl.java
│       ├── UsuarioServiceImpl.java
│       ├── RolServiceImpl.java
│       ├── ... (resto de impls)
│
├── repository/                           # Repository interfaces (puertos)
│   ├── UsuarioRepository.java
│   ├── RolRepository.java
│   ├── PermisoRepository.java
│   ├── InstitucionRepository.java
│   ├── RefreshTokenRepository.java
│   ├── TokenSeguridadRepository.java
│   ├── JwtBlocklistRepository.java
│   ├── AuditLogRepository.java
│   ├── RolPermisoRepository.java
│   ├── UsuarioRolRepository.java
│   └── ConfiguracionInstitucionRepository.java
│
├── web/                                  # APPLICATION / INFRASTRUCTURE
│   ├── handler/                          # Application Layer (inbound adapters)
│   │   ├── AuthHandler.java
│   │   ├── UsuarioHandler.java
│   │   ├── RolHandler.java
│   │   ├── PermisoHandler.java
│   │   ├── InstitucionHandler.java
│   │   ├── ConfiguracionInstitucionHandler.java
│   │   ├── AuditLogHandler.java
│   │   ├── UsuarioRolHandler.java
│   │   └── DevSeedHandler.java
│   └── router/                           # Infrastructure (HTTP routing)
│       ├── AuthRouter.java
│       ├── UsuarioRouter.java
│       ├── RolRouter.java
│       ├── PermisoRouter.java
│       ├── InstitucionRouter.java
│       ├── ConfiguracionInstitucionRouter.java
│       ├── AuditLogRouter.java
│       ├── UsuarioRolRouter.java
│       └── DevSeedRouter.java
│
├── infrastructure/                       # Infrastructure adapters
│   └── event/
│       ├── SpringDomainEventPublisher.java
│       └── DomainEventListener.java
│
├── config/                               # Infrastructure configuration
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   ├── R2dbcConfig.java
│   └── ReactiveRequestContextFilter.java
│
├── exception/                            # Infrastructure (error handling)
│   └── GlobalExceptionHandler.java
│
├── mapper/                               # Infrastructure (DTO mapping)
│   └── UsuarioMapper.java
│
├── security/                             # Infrastructure (JWT auth)
│
└── dto/                                  # Application Layer DTOs
    ├── LoginRequest.java
    ├── UsuarioRequest.java
    └── ... (resto de DTOs)
```
