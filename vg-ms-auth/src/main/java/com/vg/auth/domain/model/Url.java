package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

// DDD: Value Object inmutable que representa una URL.
// Valida formato http/https, longitud máxima de 2000 caracteres.
public record Url(String value) {

    private static final java.util.regex.Pattern URL_PATTERN =
            java.util.regex.Pattern.compile("^(http|https)://[\\w.-]+(:\\d+)?(/[\\w./%-]*)?(\\?[\\w=&.-]*)?(#[\\w-]*)?$");

    public Url {
        if (value != null && !value.isBlank()) {
            String trimmed = value.trim();
            if (trimmed.length() > 2000) {
                throw new BadRequestException("La URL no puede exceder 2000 caracteres");
            }
            if (!URL_PATTERN.matcher(trimmed).matches()) {
                throw new BadRequestException("Formato de URL invalido: " + trimmed);
            }
            value = trimmed;
        } else {
            value = null;
        }
    }

    public static Url of(String value) {
        return value == null ? null : new Url(value);
    }

    public boolean isPresent() {
        return value != null;
    }
}
