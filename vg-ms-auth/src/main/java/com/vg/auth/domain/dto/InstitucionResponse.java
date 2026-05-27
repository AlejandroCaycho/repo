package com.vg.auth.domain.dto;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitucionResponse {

    private Integer id;
    private UUID uuid;
    private String nombre;
    private String nombreCorto;
    private String email;
    private String emailSecundario;
    private String telefono;
    private String telefonoSecundario;
    private String sitioWeb;
    private String direccion;
    private String ciudad;
    private String departamento;
    private String pais;
    private String codigoPostal;
    private String logoUrl;
    private String tipoInstitucion;
    private String codigoModular;
    private String resolucionCreacion;
    private Boolean activa;
    private String createdAt;
    private String updatedAt;
}
