package com.vg.auth.service.impl;

import com.vg.auth.domain.model.DomainEvent;
import com.vg.auth.domain.model.DomainEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

// DDD: Adaptador de infraestructura para DomainEventPublisher.
//
// Implementa el puerto definido en la capa de dominio utilizando
// el ApplicationEventPublisher de Spring.
//
// Hexagonal Architecture:
// - Puerto (Domain): DomainEventPublisher
// - Adaptador (Infrastructure): SpringDomainEventPublisher
@Slf4j
@Component
@RequiredArgsConstructor
public class SpringDomainEventPublisher implements DomainEventPublisher {

    private final ApplicationEventPublisher springPublisher;

    @Override
    public void publish(DomainEvent event) {
        log.debug("Publicando evento de dominio: {} (ocurrido en: {})",
                event.eventName(), event.occurredOn());
        springPublisher.publishEvent(event);
    }
}
