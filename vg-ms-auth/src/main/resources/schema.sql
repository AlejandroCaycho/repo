CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS jwt_blocklist CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS tokens_seguridad CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS usuario_roles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS rol_permisos CASCADE;
DROP TABLE IF EXISTS permisos CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS configuracion_institucion CASCADE;
DROP TABLE IF EXISTS instituciones CASCADE;

CREATE TABLE IF NOT EXISTS instituciones (
    id                  SERIAL       PRIMARY KEY,
    uuid                UUID         NOT NULL DEFAULT gen_random_uuid(),
    nombre              VARCHAR(200) NOT NULL,
    nombre_corto        VARCHAR(80),
    email               VARCHAR(200) NOT NULL,
    email_secundario    VARCHAR(200),
    telefono            VARCHAR(30),
    telefono_secundario VARCHAR(30),
    sitio_web           VARCHAR(255),
    direccion           VARCHAR(255),
    ciudad              VARCHAR(100),
    departamento        VARCHAR(100),
    pais                VARCHAR(100) DEFAULT 'Peru',
    codigo_postal       VARCHAR(20),
    logo_url            VARCHAR(500),
    tipo_institucion    VARCHAR(80),
    codigo_modular      VARCHAR(80),
    resolucion_creacion VARCHAR(120),
    activa              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_instituciones_uuid           UNIQUE (uuid),
    CONSTRAINT uk_instituciones_nombre         UNIQUE (nombre),
    CONSTRAINT uk_instituciones_codigo_modular UNIQUE (codigo_modular)
);

CREATE TABLE IF NOT EXISTS configuracion_institucion (
    id                             SERIAL       PRIMARY KEY,
    institucion_id                 INTEGER      NOT NULL,
    escala_calificacion_id         INTEGER,
    tema_color_primario            VARCHAR(40)  DEFAULT '#1A73E8',
    tema_color_secundario          VARCHAR(40)  DEFAULT '#34A853',
    logo_url                       VARCHAR(500),
    mantener_registros_anos        SMALLINT     DEFAULT 5,
    permitir_registro_padres       BOOLEAN      DEFAULT TRUE,
    padres_ven_calificaciones      BOOLEAN      DEFAULT TRUE,
    padres_ven_asistencia          BOOLEAN      DEFAULT TRUE,
    padres_ven_tareas              BOOLEAN      DEFAULT TRUE,
    umbral_calificacion_baja       NUMERIC(5,2) DEFAULT 11.00,
    notificacion_inasistencia      BOOLEAN      DEFAULT TRUE,
    notificacion_calificacion_baja BOOLEAN      DEFAULT TRUE,
    horario_inicio_clases          TIME         DEFAULT '07:30:00',
    horario_fin_clases             TIME         DEFAULT '15:00:00',
    dias_laborables                VARCHAR(120) DEFAULT 'lunes,martes,miercoles,jueves,viernes',
    idioma_principal               VARCHAR(20)  DEFAULT 'es',
    zona_horaria                   VARCHAR(80)  DEFAULT 'America/Lima',
    moneda                         VARCHAR(10)  DEFAULT 'PEN',
    created_at                     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_configuracion_institucion FOREIGN KEY (institucion_id)
        REFERENCES instituciones(id) ON DELETE CASCADE,
    CONSTRAINT uk_configuracion_institucion UNIQUE (institucion_id),
    CONSTRAINT ck_configuracion_colores_hex CHECK (
        (tema_color_primario   IS NULL OR tema_color_primario   ~ '^#[0-9A-Fa-f]{6}$') AND
        (tema_color_secundario IS NULL OR tema_color_secundario ~ '^#[0-9A-Fa-f]{6}$')
    ),
    CONSTRAINT ck_configuracion_rangos CHECK (
        (mantener_registros_anos  IS NULL OR mantener_registros_anos  BETWEEN 1 AND 50) AND
        (umbral_calificacion_baja IS NULL OR umbral_calificacion_baja BETWEEN 0 AND 20)
    ),
    CONSTRAINT ck_configuracion_horario CHECK (
        horario_inicio_clases IS NULL OR
        horario_fin_clases    IS NULL OR
        horario_fin_clases > horario_inicio_clases
    ),
    CONSTRAINT ck_configuracion_moneda CHECK (
        moneda IS NULL OR moneda ~ '^[A-Z]{3}$'
    )
);

CREATE TABLE IF NOT EXISTS roles (
    id             SERIAL       PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    descripcion    VARCHAR(255),
    es_sistema     BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_roles_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS permisos (
    id          SERIAL       PRIMARY KEY,
    modulo      VARCHAR(100) NOT NULL,
    accion      VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT uk_permisos_modulo_accion UNIQUE (modulo, accion)
);

CREATE TABLE IF NOT EXISTS rol_permisos (
    rol_id     INTEGER NOT NULL,
    permiso_id INTEGER NOT NULL,
    CONSTRAINT pk_rol_permisos         PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT fk_rol_permisos_rol     FOREIGN KEY (rol_id)     REFERENCES roles(id)    ON DELETE CASCADE,
    CONSTRAINT fk_rol_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id                  SERIAL       PRIMARY KEY,
    uuid                UUID         NOT NULL DEFAULT gen_random_uuid(),
    institucion_id      INTEGER      NOT NULL,
    nombre              VARCHAR(200) NOT NULL,
    email               VARCHAR(200) NOT NULL,
    contrasena_hash     VARCHAR(512) NOT NULL,
    telefono            VARCHAR(30),
    foto_url            VARCHAR(500),
    estado              VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    ultimo_acceso       TIMESTAMPTZ,
    token_recuperacion  VARCHAR(255),
    token_expiracion    TIMESTAMPTZ,
    requiere_cambio_pwd BOOLEAN      NOT NULL DEFAULT FALSE,
    intentos_fallidos   SMALLINT     NOT NULL DEFAULT 0,
    bloqueado_hasta     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_usuarios_institucion       FOREIGN KEY (institucion_id)
        REFERENCES instituciones(id) ON DELETE CASCADE,
    CONSTRAINT uk_usuarios_uuid              UNIQUE (uuid),
    CONSTRAINT uk_usuarios_institucion_email UNIQUE (institucion_id, email),
    CONSTRAINT ck_usuarios_estado            CHECK (estado IN ('activo', 'inactivo', 'suspendido', 'pendiente')),
    CONSTRAINT ck_usuarios_intentos          CHECK (intentos_fallidos >= 0)
);

CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id   INTEGER     NOT NULL,
    rol_id       INTEGER     NOT NULL,
    asignado_por INTEGER,
    asignado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_usuario_roles              PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usuario_roles_usuario      FOREIGN KEY (usuario_id)   REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_roles_rol          FOREIGN KEY (rol_id)       REFERENCES roles(id)    ON DELETE CASCADE,
    CONSTRAINT fk_usuario_roles_asignado_por FOREIGN KEY (asignado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tokens_seguridad (
    id         BIGSERIAL    PRIMARY KEY,
    usuario_id INTEGER      NOT NULL,
    token      VARCHAR(512) NOT NULL,
    tipo       VARCHAR(40)  NOT NULL,
    expira_en  TIMESTAMPTZ  NOT NULL,
    usado      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_tokens_seguridad_token   UNIQUE (token),
    CONSTRAINT fk_tokens_seguridad_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT ck_tokens_seguridad_tipo    CHECK (
        tipo IN ('recuperacion_pwd', 'verificacion_email', 'invitacion')
    )
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      INTEGER      NOT NULL,
    token           VARCHAR(512) NOT NULL,
    expira_en       TIMESTAMPTZ  NOT NULL,
    revocado        BOOLEAN      NOT NULL DEFAULT FALSE,
    reemplazado_por VARCHAR(512),
    ip_origen       VARCHAR(45),
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_refresh_tokens_token    UNIQUE (token),
    CONSTRAINT fk_refresh_tokens_usuario  FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jwt_blocklist (
    id           BIGSERIAL    PRIMARY KEY,
    jti          VARCHAR(255) NOT NULL,
    expira_en    TIMESTAMPTZ  NOT NULL,
    creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_jwt_blocklist_jti     UNIQUE (jti)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id               BIGSERIAL    PRIMARY KEY,
    usuario_id       INTEGER,
    tabla            VARCHAR(120) NOT NULL,
    registro_id      INTEGER      NOT NULL,
    accion           VARCHAR(20)  NOT NULL,
    datos_anteriores TEXT,
    datos_nuevos     TEXT,
    ip_origen        VARCHAR(45),
    user_agent       VARCHAR(500),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_audit_log_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT ck_audit_log_accion  CHECK (
        accion IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED')
    )
);

CREATE INDEX IF NOT EXISTS idx_usuarios_institucion ON usuarios(institucion_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabla_registro ON audit_log(tabla, registro_id);
CREATE INDEX IF NOT EXISTS idx_tokens_seguridad_usuario ON tokens_seguridad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_jwt_blocklist_jti ON jwt_blocklist(jti);

-- Predefined System Roles
INSERT INTO roles (nombre, descripcion, es_sistema) VALUES
('SUPERROOT', 'Super Administrador del Sistema', true),
('ADMIN', 'Administrador de Institucion', true),
('DIRECTOR', 'Director del Colegio', true),
('TUTOR', 'Tutor de Aula', true),
('PROFESOR', 'Profesor / Docente', true),
('AUXILIAR', 'Auxiliar de Educacion', true),
('PADRE_DE_FAMILIA', 'Padre de Familia / Apoderado', true),
('PSICOLOGIA', 'Psicologo / Departamento de Psicologia', true)
ON CONFLICT (nombre) DO NOTHING;

-- Predefined Core Permissions
INSERT INTO permisos (modulo, accion, descripcion) VALUES
('INSTITUCIONES', 'CREAR', 'Crear nuevas instituciones'),
('INSTITUCIONES', 'VER', 'Listar y ver detalles de instituciones'),
('INSTITUCIONES', 'EDITAR', 'Editar datos de instituciones'),
('INSTITUCIONES', 'ELIMINAR', 'Eliminar instituciones del sistema'),
('CONFIGURACION', 'CREAR', 'Crear configuracion de institucion'),
('CONFIGURACION', 'VER', 'Ver configuracion de institucion'),
('CONFIGURACION', 'EDITAR', 'Editar configuracion de institucion'),
('CONFIGURACION', 'ELIMINAR', 'Eliminar configuracion de institucion'),
('ROLES', 'CREAR', 'Crear nuevos roles'),
('ROLES', 'VER', 'Listar y ver roles'),
('ROLES', 'EDITAR', 'Editar roles'),
('ROLES', 'ELIMINAR', 'Eliminar roles'),
('PERMISOS', 'CREAR', 'Crear nuevos permisos'),
('PERMISOS', 'VER', 'Listar y ver permisos'),
('PERMISOS', 'EDITAR', 'Editar permisos'),
('PERMISOS', 'ELIMINAR', 'Eliminar permisos'),
('USUARIOS', 'CREAR', 'Crear nuevos usuarios'),
('USUARIOS', 'VER', 'Listar y ver usuarios'),
('USUARIOS', 'EDITAR', 'Editar usuarios'),
('USUARIOS', 'ELIMINAR', 'Eliminar usuarios'),
('AUDIT', 'VER', 'Ver registros de auditoria del sistema')
ON CONFLICT (modulo, accion) DO NOTHING;

-- Map ALL core permissions to SUPERROOT
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM roles r, permisos p
WHERE r.nombre = 'SUPERROOT'
ON CONFLICT DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre IN ('ADMIN', 'DIRECTOR')
  AND p.modulo IN ('CONFIGURACION', 'ROLES', 'USUARIOS')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre IN ('TUTOR', 'PROFESOR', 'AUXILIAR', 'PADRE_DE_FAMILIA', 'PSICOLOGIA')
  AND p.modulo = 'USUARIOS' AND p.accion = 'READ'
ON CONFLICT DO NOTHING;
