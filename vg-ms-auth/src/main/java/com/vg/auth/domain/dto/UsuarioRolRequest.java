package com.vg.auth.domain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRolRequest {

    @NotNull(message = "El usuarioId es obligatorio")
    private Integer usuarioId;

    @NotNull(message = "El rolId es obligatorio")
    private Integer rolId;

    private Integer asignadoPor;
}