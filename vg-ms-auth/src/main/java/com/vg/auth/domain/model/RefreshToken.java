package com.vg.auth.domain.model;

import com.vg.auth.domain.model.Entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

// DDD: Entity del agregado Usuario — token de refresco JWT.
//
// Implementa rotación de tokens: cada vez que se usa un refresh
// token para obtener uno nuevo, se revoca el anterior y se crea
// uno nuevo, mejorando la seguridad.
@Table("refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    private Integer id;

    @Column("usuario_id")
    private Integer usuarioId;

    private String token;

    @Column("expira_en")
    private OffsetDateTime expiraEn;

    private Boolean revocado;

    @Column("reemplazado_por")
    private String reemplazadoPor;

    @Column("ip_origen")
    private String ipOrigen;

    @Column("user_agent")
    private String userAgent;

    @Column("created_at")
    private OffsetDateTime createdAt;

    // DDD: Comportamiento — verifica si el token expiró.
    public boolean expirado(OffsetDateTime ahora) {
        return this.expiraEn != null && this.expiraEn.isBefore(ahora);
    }

    // DDD: Comportamiento — revoca el token y lo reemplaza por uno nuevo (rotación).
    public void revocar(String nuevoToken) {
        this.revocado = true;
        this.reemplazadoPor = nuevoToken;
    }
}
