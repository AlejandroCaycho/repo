package com.vg.auth.util;

import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public class ReactiveRequestContextHolder {
    public static final Class<ServerWebExchange> CONTEXT_KEY = ServerWebExchange.class;

    public static Mono<ServerWebExchange> getExchange() {
        return Mono.deferContextual(ctx -> {
            if (ctx.hasKey(CONTEXT_KEY)) {
                return Mono.just(ctx.get(CONTEXT_KEY));
            }
            return Mono.empty();
        });
    }
}
