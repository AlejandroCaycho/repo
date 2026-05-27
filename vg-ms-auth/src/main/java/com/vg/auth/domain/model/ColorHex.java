package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

// DDD: Value Object inmutable que representa un color en formato hexadecimal (#RRGGBB).
//
// Encapsula la validación de formato de color hexadecimal.
public record ColorHex(String value) {

    private static final java.util.regex.Pattern HEX_PATTERN =
            java.util.regex.Pattern.compile("^#[0-9A-Fa-f]{6}$");

    public ColorHex {
        if (value != null && !value.isBlank()) {
            String trimmed = value.trim();
            if (!HEX_PATTERN.matcher(trimmed).matches()) {
                throw new BadRequestException("Formato de color hexadecimal invalido: " + trimmed + ". Use #RRGGBB");
            }
            value = trimmed.toUpperCase();
        } else {
            value = null;
        }
    }

    public static ColorHex of(String value) {
        return value == null ? null : new ColorHex(value);
    }

    public boolean isPresent() {
        return value != null;
    }
}
