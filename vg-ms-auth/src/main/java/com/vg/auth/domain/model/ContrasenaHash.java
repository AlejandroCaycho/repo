package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

// DDD: Value Object inmutable que representa un hash de contraseña.
//
// Encapsula la validación del formato del hash BCrypt
// y previene el uso de contraseñas en texto plano en la capa de dominio.
public record ContrasenaHash(String value) {

    private static final String BCRYPT_PREFIX = "$2a$";
    private static final String BCRYPT_PREFIX_10 = "$2b$";
    private static final String BCRYPT_PREFIX_12 = "$2y$";

    public ContrasenaHash {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("El hash de contrasena no puede estar vacio");
        }
        if (!esHashValido(value)) {
            throw new BadRequestException("Formato de hash BCrypt invalido");
        }
    }

    public static ContrasenaHash of(String value) {
        return value == null ? null : new ContrasenaHash(value);
    }

    // Verifica que el string tenga formato BCrypt.
    // BCrypt genera strings de 60 caracteres que comienzan con $2a$, $2b$ o $2y$.
    private boolean esHashValido(String hash) {
        return hash.startsWith(BCRYPT_PREFIX)
                || hash.startsWith(BCRYPT_PREFIX_10)
                || hash.startsWith(BCRYPT_PREFIX_12);
    }
}
