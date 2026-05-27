package com.vg.auth.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "El email es requerido")
    @Email(message = "Formato de email invalido")
    private String email;

    @NotBlank(message = "La contraseña es requerida")
    private String contrasena;
}
