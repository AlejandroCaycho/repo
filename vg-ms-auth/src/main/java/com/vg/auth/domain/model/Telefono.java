package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

// DDD: Value Object inmutable que representa un número de teléfono.
//
// Encapsula la lógica de formato y validación telefónica.
public record Telefono(String value) {

    private static final java.util.regex.Pattern TELEFONO_PATTERN =
            java.util.regex.Pattern.compile("^[+]?[0-9]{7,15}$");

    public Telefono {
        if (value != null && !value.isBlank()) {
            String cleaned = value.trim().replaceAll("[\\s-()]", "");
            if (!TELEFONO_PATTERN.matcher(cleaned).matches()) {
                throw new BadRequestException("Formato de telefono invalido: " + value);
            }
            value = cleaned;
        } else {
            value = null;
        }
    }

    public static Telefono of(String value) {
        return value == null ? null : new Telefono(value);
    }

    public boolean isPresent() {
        return value != null;
    }
}
