package com.vg.auth.domain.model;

// DDD: Puerto (interfaz) para publicar Domain Events.
//
// En tÃ©rminos de DDD y Hexagonal Architecture, esta interfaz
// pertenece a la capa de dominio (puerto) y su implementaciÃ³n
// concreta pertenece a la infraestructura (adaptador).
//
// Implementaciones posibles:
// - Spring ApplicationEventPublisher (implementaciÃ³n actual)
// - Bus de mensajes (RabbitMQ, Kafka) para eventosè·¨-contexto
// - Persistencia en tabla de eventos
@FunctionalInterface
public interface DomainEventPublisher {
    void publish(DomainEvent event);
}

