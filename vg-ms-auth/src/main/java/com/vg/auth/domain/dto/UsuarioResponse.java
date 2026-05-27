package com.vg.auth.domain.dto;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponse {

    private Integer id;
    private UUID uuid;
    private Integer institucionId;
    private String nombre;
    private String email;
    private String telefono;
    private String fotoUrl;
    private String estado;
    private String ultimoAcceso;
    private Boolean requiereCambioPwd;
    private Short intentosFallidos;
    private String bloqueadoHasta;
    private String createdAt;
    private String updatedAt;
}
