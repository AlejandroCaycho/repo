package com.vg.auth.web.handler;

import com.vg.auth.domain.dto.AuditLogRequest;
import com.vg.auth.domain.dto.AuditLogResponse;
import com.vg.auth.service.AuditLogService;
import com.vg.auth.util.RequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
// DDD: Application Layer — handler HTTP para auditoría (inbound port adapter).
//
// Expone endpoints REST para registrar y consultar eventos
// de auditoría del sistema.
public class AuditLogHandler {

    private final AuditLogService service;
    private final RequestValidator validator;

    public Mono<ServerResponse> registrar(ServerRequest req) {
        return req.bodyToMono(AuditLogRequest.class)
                .flatMap(validator::validate)
                .flatMap(service::registrar)
                .flatMap(r -> ServerResponse.status(201).bodyValue(r));
    }

    public Mono<ServerResponse> listarTodos(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarTodos(), AuditLogResponse.class);
    }

    public Mono<ServerResponse> listarPorUsuario(ServerRequest req) {
        Integer usuarioId = Integer.parseInt(req.pathVariable("usuarioId"));
        return ServerResponse.ok()
                .body(service.listarPorUsuario(usuarioId), AuditLogResponse.class);
    }

    public Mono<ServerResponse> listarPorTabla(ServerRequest req) {
        String tabla = req.pathVariable("tabla");
        return ServerResponse.ok()
                .body(service.listarPorTabla(tabla), AuditLogResponse.class);
    }

    public Mono<ServerResponse> listarPorTablaYRegistro(ServerRequest req) {
        String tabla = req.pathVariable("tabla");
        Integer registroId = Integer.parseInt(req.pathVariable("registroId"));
        return ServerResponse.ok()
                .body(service.listarPorTablaYRegistro(tabla, registroId), AuditLogResponse.class);
    }

    public Mono<ServerResponse> listarPorAccion(ServerRequest req) {
        String accion = req.pathVariable("accion");
        return ServerResponse.ok()
                .body(service.listarPorAccion(accion), AuditLogResponse.class);
    }

    public Mono<ServerResponse> buscarPorId(ServerRequest req) {
        Long id = Long.parseLong(req.pathVariable("id"));
        return service.buscarPorId(id)
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> eliminar(ServerRequest req) {
        Long id = Long.parseLong(req.pathVariable("id"));
        return service.eliminar(id)
                .then(ServerResponse.noContent().build());
    }
}
