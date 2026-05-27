package com.vg.auth.web.handler;

import com.vg.auth.domain.dto.UsuarioRolRequest;
import com.vg.auth.domain.dto.UsuarioRolResponse;
import com.vg.auth.service.UsuarioRolService;
import com.vg.auth.util.RequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
// DDD: Application Layer — handler HTTP para asignación usuario-rol (inbound port adapter).
//
// Expone endpoints REST para asignar y remover roles de usuarios,
// y consultar las relaciones existentes.
public class UsuarioRolHandler {

    private final UsuarioRolService service;
    private final RequestValidator validator;

    public Mono<ServerResponse> asignarRol(ServerRequest req) {
        return req.bodyToMono(UsuarioRolRequest.class)
                .flatMap(validator::validate)
                .flatMap(service::asignarRol)
                .flatMap(r -> ServerResponse.status(201).bodyValue(r));
    }

    public Mono<ServerResponse> listarTodos(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarTodos(), UsuarioRolResponse.class);
    }

    public Mono<ServerResponse> listarRolesPorUsuario(ServerRequest req) {
        Integer usuarioId = Integer.parseInt(req.pathVariable("usuarioId"));
        return ServerResponse.ok()
                .body(service.listarRolesPorUsuario(usuarioId), UsuarioRolResponse.class);
    }

    public Mono<ServerResponse> listarUsuariosPorRol(ServerRequest req) {
        Integer rolId = Integer.parseInt(req.pathVariable("rolId"));
        return ServerResponse.ok()
                .body(service.listarUsuariosPorRol(rolId), UsuarioRolResponse.class);
    }

    public Mono<ServerResponse> quitarRol(ServerRequest req) {
        Integer usuarioId = Integer.parseInt(req.pathVariable("usuarioId"));
        Integer rolId = Integer.parseInt(req.pathVariable("rolId"));
        return service.quitarRol(usuarioId, rolId)
                .then(ServerResponse.noContent().build());
    }
}
