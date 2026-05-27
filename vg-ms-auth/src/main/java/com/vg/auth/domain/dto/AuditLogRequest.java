package com.vg.auth.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequest {

    private Integer usuarioId;

    @NotBlank(message = "La tabla es obligatoria")
    private String tabla;

    @NotNull(message = "El registroId es obligatorio")
    private Integer registroId;

    @NotBlank(message = "La acción es obligatoria")
    private String accion;

    private String datosAnteriores;
    private String datosNuevos;
    private String ipOrigen;
    private String userAgent;
}