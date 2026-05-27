package com.vg.auth.domain.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermisoResponse {

    private Integer id;
    private String modulo;
    private String accion;
    private String descripcion;
    private String estado;
}