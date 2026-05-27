package com.vg.auth.domain.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRolResponse {

    private Integer usuarioId;
    private Integer rolId;
    private Integer asignadoPor;
    private String asignadoEn;
}
