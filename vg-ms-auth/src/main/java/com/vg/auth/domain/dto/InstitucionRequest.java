package com.vg.auth.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitucionRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String nombreCorto;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email inválido")
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
}