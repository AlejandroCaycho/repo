package com.vg.auth.domain.model;

import java.time.Instant;

// DDD: Interface base para todos los Domain Events.
//
// Los Domain Events representan algo que ocurrió en el dominio
// y es relevante para otros componentes del sistema (dentro o fuera
// del bounded context). Son inmutables y se nombran en tiempo pasado.
//
// Beneficios de Domain Events:
// - Desacoplan el emisor del receptor
// - Permiten reaccionar a cambios del dominio de forma explícita
// - Son parte del lenguaje ubicuo ("cuando un usuario se registra...")
// - Pueden persistirse para auditoría o proyecciones
public interface DomainEvent {

    // @return timestamp de cuando ocurrió el evento
    Instant occurredOn();

    // @return nombre único del evento para trazabilidad
    String eventName();
}
