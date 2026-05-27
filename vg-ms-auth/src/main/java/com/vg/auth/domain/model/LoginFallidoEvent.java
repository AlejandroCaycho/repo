package com.vg.auth.domain.model;

import java.time.Instant;

// DDD: Domain Event — ocurre cuando un intento de login falla.
//
// Este evento puede disparar:
// - Actualización del contador de intentos fallidos (regla de negocio)
// - Bloqueo de cuenta al superar el límite
// - Notificación al usuario por email
// - Registro en el log de auditoría
public record LoginFallidoEvent(
        String email,
        Integer usuarioId,
        String motivo,
        int intentosFallidos,
        int limiteIntentos,
        Instant occurredOn
) implements DomainEvent {

    private static final int LIMITE_INTENTOS = 5;

    public LoginFallidoEvent(String email, Integer usuarioId, String motivo, int intentosFallidos) {
        this(email, usuarioId, motivo, intentosFallidos, LIMITE_INTENTOS, Instant.now());
    }

    @Override
    public String eventName() {
        return "usuario.login_fallido";
    }

    // DDD: Comportamiento del dominio: ¿se debe bloquear al usuario?
    public boolean debeBloquear() {
        return intentosFallidos >= limiteIntentos;
    }
}
