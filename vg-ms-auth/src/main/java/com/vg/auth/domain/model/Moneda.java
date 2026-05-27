package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

import java.util.Currency;
import java.util.Set;

// DDD: Value Object inmutable que representa una moneda con código ISO 4217.
//
// Encapsula la validación de códigos de moneda estándar usando java.util.Currency.
public record Moneda(String value) {

    private static final Set<String> CODIGOS_VALIDOS = Set.of("PEN", "USD", "EUR", "COP", "MXN", "CLP", "ARS", "BOB");

    public Moneda {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("La moneda no puede estar vacia");
        }
        String normalized = value.trim().toUpperCase();
        if (normalized.length() != 3) {
            throw new BadRequestException("El codigo de moneda debe tener 3 caracteres (ISO 4217)");
        }
        try {
            Currency.getInstance(normalized);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Codigo de moneda ISO 4217 invalido: " + normalized);
        }
        value = normalized;
    }

    public static Moneda of(String value) {
        return value == null ? null : new Moneda(value);
    }

    public String simbolo() {
        try {
            return Currency.getInstance(value).getSymbol();
        } catch (Exception e) {
            return value;
        }
    }
}
