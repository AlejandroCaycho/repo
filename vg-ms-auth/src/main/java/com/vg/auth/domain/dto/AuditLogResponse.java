package com.vg.auth.domain.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private Long id;
    private Integer usuarioId;
    private String tabla;
    private Integer registroId;
    private String accion;
    private String datosAnteriores;
    private String datosNuevos;
    private String ipOrigen;
    private String userAgent;
    private String createdAt;
}
