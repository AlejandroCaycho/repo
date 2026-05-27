package com.vg.auth.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermisoRequest {

    @NotBlank(message = "El módulo es obligatorio")
    private String modulo;

    @NotBlank(message = "La acción es obligatoria")
    private String accion;

    private String descripcion;
}