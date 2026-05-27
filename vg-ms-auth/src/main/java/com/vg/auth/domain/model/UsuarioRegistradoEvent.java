package com.vg.auth.domain.model;

import java.time.Instant;

// DDD: Domain Event — ocurre cuando un usuario se registra en el sistema.
//
// Este evento puede disparar procesos como:
// - Envío de email de bienvenida
// - Notificación al administrador de la institución
// - Creación de recursos asociados (expediente, perfil)
public record UsuarioRegistradoEvent(
        Integer usuarioId,
        String email,
        String nombre,
        Integer institucionId,
        String rolAsignado,
        Instant occurredOn
) implements DomainEvent {

    public UsuarioRegistradoEvent(Integer usuarioId, String email, String nombre, Integer institucionId, String rolAsignado) {
        this(usuarioId, email, nombre, institucionId, rolAsignado, Instant.now());
    }

    @Override
    public String eventName() {
        return "usuario.registrado";
    }
}
