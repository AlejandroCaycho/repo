package com.vg.auth.domain.model;

import com.vg.auth.exception.BadRequestException;

import java.util.Set;

// DDD: Value Object inmutable que representa el estado de un usuario.
//
// Encapsula las reglas de negocio sobre qué estados son válidos
// y las transiciones permitidas entre ellos.
public record EstadoUsuario(String value) {

    private static final Set<String> ESTADOS_VALIDOS = Set.of("activo", "inactivo", "bloqueado", "pendiente");

    public EstadoUsuario {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("El estado no puede estar vacio");
        }
        String normalized = value.trim().toLowerCase();
        if (!ESTADOS_VALIDOS.contains(normalized)) {
            throw new BadRequestException("Estado invalido: '" + value + "'. Use: " + String.join(", ", ESTADOS_VALIDOS));
        }
        value = normalized;
    }

    public static EstadoUsuario of(String value) {
        return value == null ? null : new EstadoUsuario(value);
    }

    public boolean esActivo() {
        return "activo".equals(value);
    }

    public boolean estaBloqueado() {
        return "bloqueado".equals(value);
    }

    public boolean estaInactivo() {
        return "inactivo".equals(value);
    }

    public boolean estaPendiente() {
        return "pendiente".equals(value);
    }

    // DDD: Comportamiento del dominio: verifica si este estado permite login.
    public boolean permiteLogin() {
        return esActivo();
    }

    // DDD: Comportamiento del dominio — verifica si se puede hacer transición a otro estado.
    public boolean puedeTransitarA(String nuevoEstado) {
        return ESTADOS_VALIDOS.contains(nuevoEstado) && !value.equals(nuevoEstado);
    }

    // DDD: Comportamiento del dominio — verifica si el estado actual puede desactivarse.
    public boolean puedeDesactivar() {
        return esActivo() || estaBloqueado();
    }

    // DDD: Comportamiento del dominio — verifica si el estado actual puede activarse.
    public boolean puedeActivar() {
        return estaInactivo() || estaBloqueado();
    }

    // DDD: Comportamiento del dominio — devuelve el valor para el estado "inactivo".
    public String desactivar() {
        return "inactivo";
    }

    // DDD: Comportamiento del dominio — devuelve el valor para el estado "activo".
    public String activar() {
        return "activo";
    }
}
