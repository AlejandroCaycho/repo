package com.vg.auth.domain.model;

import com.vg.auth.domain.model.Entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

// DDD: Entity — log de eventos de dominio (trazabilidad/auditoría).
//
// Registra cada operación del sistema con los datos anteriores
// y nuevos en formato JSONB para permitir trazabilidad completa
// de todos los cambios realizados en el dominio.
@Table("audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    private Long id;

    @Column("usuario_id")
    private Integer usuarioId;

    private String tabla;

    @Column("registro_id")
    private Integer registroId;

    private String accion;

    @Column("datos_anteriores")
    private String datosAnteriores;

    @Column("datos_nuevos")
    private String datosNuevos;

    @Column("ip_origen")
    private String ipOrigen;

    @Column("user_agent")
    private String userAgent;

    @Column("created_at")
    private OffsetDateTime createdAt;
}
