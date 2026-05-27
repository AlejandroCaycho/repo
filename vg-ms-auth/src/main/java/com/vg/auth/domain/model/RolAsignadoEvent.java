package com.vg.auth.domain.model;

import java.time.Instant;

// DDD: Domain Event — ocurre cuando se asigna un rol a un usuario.
//
// Refleja una regla de negocio importante en el dominio educativo:
// la asignación de roles determina los permisos y capacidades del usuario.
public record RolAsignadoEvent(
        Integer usuarioId,
        Integer rolId,
        String nombreRol,
        Integer asignadoPor,
        Instant occurredOn
) implements DomainEvent {

    public RolAsignadoEvent(Integer usuarioId, Integer rolId, String nombreRol, Integer asignadoPor) {
        this(usuarioId, rolId, nombreRol, asignadoPor, Instant.now());
    }

    @Override
    public String eventName() {
        return "usuario.rol_asignado";
    }
}
