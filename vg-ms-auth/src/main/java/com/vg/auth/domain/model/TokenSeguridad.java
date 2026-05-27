package com.vg.auth.domain.model;

import com.vg.auth.domain.model.Entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

// DDD: Entity del agregado Usuario — token de seguridad de un solo uso.
//
// Se utiliza para operaciones sensibles como restablecimiento
// de contraseña o verificación de email. Expiran después de
// un tiempo determinado y no pueden reutilizarse.
@Table("tokens_seguridad")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenSeguridad {

    @Id
    private Integer id;

    @Column("usuario_id")
    private Integer usuarioId;

    private String token;
    private String tipo;

    @Column("expira_en")
    private OffsetDateTime expiraEn;

    private Boolean usado;

    @Column("created_at")
    private OffsetDateTime createdAt;

    // DDD: Comportamiento — verifica si el token es válido (no usado y no expirado).
    public boolean esValido(OffsetDateTime ahora) {
        return !Boolean.TRUE.equals(this.usado)
                && this.expiraEn != null
                && this.expiraEn.isAfter(ahora);
    }

    // DDD: Comportamiento — marca el token como usado (un solo uso).
    public void marcarUsado() {
        this.usado = true;
    }
}
