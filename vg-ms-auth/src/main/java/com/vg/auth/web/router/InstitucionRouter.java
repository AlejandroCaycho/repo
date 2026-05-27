package com.vg.auth.web.router;

import com.vg.auth.web.handler.InstitucionHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
@RequiredArgsConstructor
// DDD: Infrastructure — router HTTP para endpoints de instituciones.
//
// Configura las rutas REST para CRUD de instituciones,
// activación/desactivación y consulta por estado.
public class InstitucionRouter {

    private final InstitucionHandler handler;

    @Bean
    public RouterFunction<ServerResponse> institucionRoutes() {
        return RouterFunctions.route()
                .POST("/api/v1/instituciones",              handler::crear)
                .GET("/api/v1/instituciones",               handler::listarActivas)
                .GET("/api/v1/instituciones/todas",         handler::listarTodas)
                .GET("/api/v1/instituciones/estado/{estado}", handler::listarPorEstado)
                .GET("/api/v1/instituciones/id/{id}",        handler::buscarPorId)
                .GET("/api/v1/instituciones/{uuid}",        handler::buscarPorUuid)
                .PUT("/api/v1/instituciones/{uuid}",        handler::actualizar)
                .PATCH("/api/v1/instituciones/{uuid}/desactivar", handler::desactivar)
                .PATCH("/api/v1/instituciones/{uuid}/activar",    handler::activar)
                .DELETE("/api/v1/instituciones/{uuid}",     handler::eliminar)
                .build();
    }
}
