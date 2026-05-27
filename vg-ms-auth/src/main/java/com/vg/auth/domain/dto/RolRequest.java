package com.vg.auth.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String descripcion;
    private Boolean esSistema;
}