package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

import java.math.BigDecimal;

// DDD: Value Object inmutable que representa un rango de calificación (0-20).
//
// Encapsula las reglas de negocio del sistema de calificación educativo peruano.
public record RangoCalificacion(BigDecimal value) {

    private static final BigDecimal MIN = BigDecimal.ZERO;
    private static final BigDecimal MAX = new BigDecimal("20");

    public RangoCalificacion {
        if (value == null) {
            throw new BadRequestException("La calificacion no puede ser nula");
        }
        if (value.compareTo(MIN) < 0 || value.compareTo(MAX) > 0) {
            throw new BadRequestException("La calificacion debe estar entre " + MIN + " y " + MAX);
        }
    }

    public static RangoCalificacion of(BigDecimal value) {
        return value == null ? null : new RangoCalificacion(value);
    }

    public static RangoCalificacion of(String value) {
        return value == null ? null : new RangoCalificacion(new BigDecimal(value));
    }

    public boolean esAprobatoria() {
        return value.compareTo(new BigDecimal("11")) >= 0;
    }

    public boolean esBaja() {
        return value.compareTo(new BigDecimal("11")) < 0;
    }
}
