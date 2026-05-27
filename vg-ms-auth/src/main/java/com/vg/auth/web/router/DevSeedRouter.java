package com.vg.auth.web.router;

import com.vg.auth.web.handler.DevSeedHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
// DDD: Infrastructure — router HTTP para seed de desarrollo.
//
// Expone el endpoint POST /api/v1/dev/seed para inicializar
// datos de prueba en entornos de desarrollo.
public class DevSeedRouter {

    @Bean
    public RouterFunction<ServerResponse> devRoutes(DevSeedHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/dev", builder -> builder
                        .POST("/seed", handler::seed)
                )
                .build();
    }
}
