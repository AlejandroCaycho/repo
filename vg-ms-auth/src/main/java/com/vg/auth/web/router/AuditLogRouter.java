package com.vg.auth.web.router;

import com.vg.auth.web.handler.AuditLogHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
@RequiredArgsConstructor
// DDD: Infrastructure — router HTTP para endpoints de auditoría.
//
// Configura las rutas REST para registrar y consultar
// eventos de auditoría del sistema.
public class AuditLogRouter {

    private final AuditLogHandler handler;

    @Bean
    public RouterFunction<ServerResponse> auditLogRoutes() {
        return RouterFunctions.route()
                .POST("/api/v1/audit-log",                                          handler::registrar)
                .GET("/api/v1/audit-log",                                           handler::listarTodos)
                .GET("/api/v1/audit-log/{id}",                                      handler::buscarPorId)
                .GET("/api/v1/audit-log/usuario/{usuarioId}",                       handler::listarPorUsuario)
                .GET("/api/v1/audit-log/tabla/{tabla}",                             handler::listarPorTabla)
                .GET("/api/v1/audit-log/tabla/{tabla}/registro/{registroId}",       handler::listarPorTablaYRegistro)
                .GET("/api/v1/audit-log/accion/{accion}",                           handler::listarPorAccion)
                .DELETE("/api/v1/audit-log/{id}",                                   handler::eliminar)
                .build();
    }
}