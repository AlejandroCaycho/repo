package com.vg.auth.service.impl;

import com.vg.auth.domain.model.LoginFallidoEvent;
import com.vg.auth.domain.model.RolAsignadoEvent;
import com.vg.auth.domain.model.UsuarioRegistradoEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

// DDD: Infrastructure Layer — Listener de Domain Events.
//
// Los Domain Events permiten reaccionar a cambios del dominio
// de forma desacoplada. Los listeners pertenecen a la capa de
// infraestructura y pueden disparar efectos secundarios como:
// - Envío de emails
// - Actualización de proyecciones
// - Notificaciones a otros bounded contexts
// - Registro en auditoría
//
// Cada método escucha un tipo específico de Domain Event.
@Slf4j
@Component
public class DomainEventListener {

    @EventListener
    public void handleUsuarioRegistrado(UsuarioRegistradoEvent event) {
        log.info("DDD Event: Usuario registrado — id={}, email={}, rol={}",
                event.usuarioId(), event.email(), event.rolAsignado());
    }

    @EventListener
    public void handleLoginFallido(LoginFallidoEvent event) {
        log.warn("DDD Event: Login fallido — email={}, intentos={}/{}",
                event.email(), event.intentosFallidos(), event.limiteIntentos());
        if (event.debeBloquear()) {
            log.warn("DDD Event: Usuario sera bloqueado por superar intentos: {}", event.email());
        }
    }

    @EventListener
    public void handleRolAsignado(RolAsignadoEvent event) {
        log.info("DDD Event: Rol asignado — usuarioId={}, rol={}, asignadoPor={}",
                event.usuarioId(), event.nombreRol(), event.asignadoPor());
    }
}
