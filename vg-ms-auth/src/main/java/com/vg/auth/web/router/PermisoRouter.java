package com.vg.auth.web.router;

import com.vg.auth.web.handler.PermisoHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
@RequiredArgsConstructor
// DDD: Infrastructure — router HTTP para endpoints de permisos.
//
// Configura las rutas REST para CRUD de permisos
// y asignación/remoción de permisos a roles.
public class PermisoRouter {

    private final PermisoHandler handler;

    @Bean
    public RouterFunction<ServerResponse> permisoRoutes() {
        return RouterFunctions.route()
                .POST("/api/v1/permisos",                       handler::crear)
                .GET("/api/v1/permisos",                        handler::listarTodos)
                .GET("/api/v1/permisos/modulo/{modulo}",        handler::listarPorModulo)
                .GET("/api/v1/permisos/rol/{rolId}",            handler::listarPorRol)
                .POST("/api/v1/permisos/asignar",               handler::asignarPermiso)
                .DELETE("/api/v1/permisos/quitar",              handler::quitarPermiso)
                .DELETE("/api/v1/permisos/rol/{rolId}/permiso/{permisoId}", handler::quitarPermisoPorRuta)
                .GET("/api/v1/permisos/{id}",                   handler::buscarPorId)
                .PUT("/api/v1/permisos/{id}",                   handler::actualizar)
                .PATCH("/api/v1/permisos/{id}/estado",          handler::cambiarEstado)
                .DELETE("/api/v1/permisos/{id}",                handler::eliminar)
                .build();
    }
}
