package com.vg.auth.web.router;

import com.vg.auth.web.handler.UsuarioHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
@RequiredArgsConstructor
// DDD: Infrastructure — router HTTP para endpoints de usuarios.
//
// Configura las rutas REST para CRUD de usuarios,
// activación/desactivación y subida/descarga de fotos.
public class UsuarioRouter {

    private final UsuarioHandler handler;

    @Bean
    public RouterFunction<ServerResponse> usuarioRoutes() {
        return RouterFunctions.route()
                .POST("/api/v1/usuarios",                              handler::crear)
                .GET("/api/v1/usuarios",                               handler::listarTodos)
                .GET("/api/v1/usuarios/institucion/{institucionId}",   handler::listarPorInstitucion)
                .GET("/api/v1/usuarios/institucion/{institucionId}/estado/{estado}", handler::listarPorInstitucionYEstado)
                .GET("/api/v1/usuarios/estado/{estado}",               handler::listarPorEstado)
                .GET("/api/v1/usuarios/id/{id}",                       handler::buscarPorId)
                .GET("/api/v1/usuarios/{uuid}",                        handler::buscarPorUuid)
                .PUT("/api/v1/usuarios/{uuid}",                        handler::actualizar)
                .PATCH("/api/v1/usuarios/{uuid}/desactivar",           handler::desactivar)
                .PATCH("/api/v1/usuarios/{uuid}/activar",              handler::activar)
                .DELETE("/api/v1/usuarios/{uuid}",                     handler::eliminar)
                .GET("/api/v1/usuarios/{uuid}/foto",                 handler::obtenerFoto)
                .POST("/api/v1/usuarios/{uuid}/foto",                handler::subirFoto)
                .build();
    }
}
