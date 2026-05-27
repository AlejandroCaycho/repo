package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

import java.util.regex.Pattern;

// DDD: Value Object inmutable que representa un correo electrónico.
//
// Los Value Objects se caracterizan por:
// - Inmutabilidad: una vez creados no pueden cambiar
// - Igualdad por valor: dos Emails son iguales si tienen el mismo string
// - Auto-validez: se validan a sí mismos en la construcción
// - Comportamiento: encapsulan lógica relacionada (formateo, validación)
public record Email(String value) {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    // Constructor compacto de record: valida el email al crear la instancia.
    // Lanza BadRequestException si el formato es inválido.
    public Email {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("El email no puede estar vacio");
        }
        String trimmed = value.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(trimmed).matches()) {
            throw new BadRequestException("Formato de email invalido: " + trimmed);
        }
        value = trimmed;
    }

    // Factory method que devuelve null si el input es null
    // (útil para campos opcionales).
    public static Email of(String value) {
        return value == null ? null : new Email(value);
    }

    // DDD: Comportamiento del dominio: obtener el dominio del email.
    public String dominio() {
        return value.substring(value.indexOf('@') + 1);
    }

    // DDD: Comportamiento del dominio: obtener el usuario/local-part.
    public String usuario() {
        return value.substring(0, value.indexOf('@'));
    }
}
