package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

import java.time.LocalTime;

// DDD: Value Object inmutable que representa un horario (rango de tiempo inicio-fin).
//
// Encapsula la validación de que la hora de fin sea posterior a la de inicio.
public record Horario(LocalTime inicio, LocalTime fin) {

    public Horario {
        if (inicio == null || fin == null) {
            throw new BadRequestException("Las horas de inicio y fin son obligatorias");
        }
        if (!fin.isAfter(inicio)) {
            throw new BadRequestException("La hora de fin debe ser posterior a la hora de inicio");
        }
    }

    public static Horario of(LocalTime inicio, LocalTime fin) {
        return new Horario(inicio, fin);
    }

    public boolean estaDentroDe(LocalTime momento) {
        return !momento.isBefore(inicio) && !momento.isAfter(fin);
    }

    public long duracionEnMinutos() {
        return java.time.Duration.between(inicio, fin).toMinutes();
    }
}
