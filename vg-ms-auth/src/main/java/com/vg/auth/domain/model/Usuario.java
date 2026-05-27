package com.vg.auth.domain.model;

import com.vg.auth.domain.model.AggregateRoot;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

// DDD: Aggregate Root del agregado "Usuario".
//
// Es la entidad raíz del agregado que agrupa a RefreshToken,
// TokenSeguridad, JwtBlocklist y UsuarioRol como entidades internas.
//
// Contiene comportamiento de negocio: control de intentos fallidos,
// bloqueo/desbloqueo, registro de acceso.
@Table("usuarios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Usuario implements AggregateRoot {

    @Id
    private Integer id;

    // DDD: Identidad de la entidad (UUID único entre bounded contexts)
    private UUID uuid;

    @Column("institucion_id")
    private Integer institucionId;

    private String nombre;

    // DDD: Usar Email VO para validación: new Email(this.email)
    private String email;

    @Column("contrasena_hash")
    private String contrasenaHash;

    private String telefono;

    @Column("foto_url")
    private String fotoUrl;

    // DDD: Usar EstadoUsuario VO para transiciones: new EstadoUsuario(this.estado).permiteLogin()
    private String estado;

    @Column("ultimo_acceso")
    private OffsetDateTime ultimoAcceso;

    @Column("token_recuperacion")
    private String tokenRecuperacion;

    @Column("token_expiracion")
    private OffsetDateTime tokenExpiracion;

    @Column("requiere_cambio_pwd")
    private Boolean requiereCambioPwd;

    @Column("intentos_fallidos")
    private Short intentosFallidos;

    @Column("bloqueado_hasta")
    private OffsetDateTime bloqueadoHasta;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;

    // DDD: Comportamiento — incrementa intentos fallidos. Retorna true si debe bloquearse.
    public boolean incrementarIntentosFallidos() {
        this.intentosFallidos = (short) (this.intentosFallidos + 1);
        return this.intentosFallidos >= 5;
    }

    // DDD: Comportamiento — bloquea al usuario hasta la fecha indicada.
    public void bloquear(OffsetDateTime hasta) {
        this.estado = "bloqueado";
        this.bloqueadoHasta = hasta;
    }

    // DDD: Comportamiento — verifica si el bloqueo expiró.
    public boolean bloqueoExpiro(OffsetDateTime ahora) {
        return "bloqueado".equals(this.estado)
                && this.bloqueadoHasta != null
                && this.bloqueadoHasta.isBefore(ahora);
    }

    // DDD: Comportamiento — desbloquea al usuario (reestado + reinicia contador).
    public void desbloquear() {
        this.estado = "activo";
        this.intentosFallidos = 0;
        this.bloqueadoHasta = null;
    }

    // DDD: Comportamiento — reinicia el contador de intentos fallidos.
    public void reiniciarIntentosFallidos() {
        this.intentosFallidos = 0;
    }

    // DDD: Comportamiento — registra la fecha del último acceso exitoso.
    public void registrarAcceso(OffsetDateTime ahora) {
        this.ultimoAcceso = ahora;
    }
}