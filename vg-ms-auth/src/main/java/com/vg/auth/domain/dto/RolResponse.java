package com.vg.auth.domain.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolResponse {

    private Integer id;
    private String nombre;
    private String descripcion;
    private Boolean esSistema;
}