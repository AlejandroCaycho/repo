package com.vg.auth.web.router;

import com.vg.auth.web.handler.UsuarioRolHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
@RequiredArgsConstructor
// DDD: Infrastructure — router HTTP para endpoints de asignación usuario-rol.
//
// Configura las rutas REST para asignar, listar y remover
// roles de usuarios.
public class UsuarioRolRouter {

    private final UsuarioRolHandler handler;

    @Bean
    public RouterFunction<ServerResponse> usuarioRolRoutes() {
        return RouterFunctions.route()
                .POST("/api/v1/usuario-roles",                          handler::asignarRol)
                .GET("/api/v1/usuario-roles",                           handler::listarTodos)
                .GET("/api/v1/usuario-roles/usuario/{usuarioId}",       handler::listarRolesPorUsuario)
                .GET("/api/v1/usuario-roles/rol/{rolId}",               handler::listarUsuariosPorRol)
                .DELETE("/api/v1/usuario-roles/{usuarioId}/{rolId}",    handler::quitarRol)
                .build();
    }
}
