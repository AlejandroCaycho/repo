package com.vg.auth.domain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolPermisoRequest {

    @NotNull(message = "El rolId es obligatorio")
    private Integer rolId;

    @NotNull(message = "El permisoId es obligatorio")
    private Integer permisoId;
}