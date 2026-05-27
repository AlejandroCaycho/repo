package com.vg.auth.web.router;

import com.vg.auth.web.handler.RolHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
@RequiredArgsConstructor
// DDD: Infrastructure — router HTTP para endpoints de roles.
//
// Configura las rutas REST para CRUD de roles,
// incluyendo filtros de roles de sistema y no sistema.
public class RolRouter {

    private final RolHandler handler;

    @Bean
    public RouterFunction<ServerResponse> rolRoutes() {
        return RouterFunctions.route()
                .POST("/api/v1/roles",                  handler::crear)
                .GET("/api/v1/roles",                   handler::listarTodos)
                .GET("/api/v1/roles/sistema",           handler::listarSistema)
                .GET("/api/v1/roles/no-sistema",        handler::listarNoSistema)
                .GET("/api/v1/roles/{id}",              handler::buscarPorId)
                .PUT("/api/v1/roles/{id}",              handler::actualizar)
                .DELETE("/api/v1/roles/{id}",           handler::eliminar)
                .build();
    }
}
