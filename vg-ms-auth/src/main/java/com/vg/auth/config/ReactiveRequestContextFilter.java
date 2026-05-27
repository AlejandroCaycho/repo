package com.vg.auth.config;

import com.vg.auth.util.ReactiveRequestContextHolder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Order(-100)
// DDD: Infrastructure — filtro WebFlux para contexto reactivo.
//
// Expone el ServerWebExchange actual en el contexto reactivo de Project Reactor,
// permitiendo acceder al request HTTP desde cualquier capa de la aplicación.
public class ReactiveRequestContextFilter implements WebFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return chain.filter(exchange)
                .contextWrite(context -> context.put(ReactiveRequestContextHolder.CONTEXT_KEY, exchange));
    }
}
