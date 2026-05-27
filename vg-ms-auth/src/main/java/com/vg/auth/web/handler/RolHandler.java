package com.vg.auth.web.handler;

import com.vg.auth.domain.dto.RolRequest;
import com.vg.auth.domain.dto.RolResponse;
import com.vg.auth.service.RolService;
import com.vg.auth.util.RequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
// DDD: Application Layer — handler HTTP para roles (inbound port adapter).
//
// Expone endpoints REST para CRUD de roles, incluyendo
// filtros para roles de sistema y no sistema.
public class RolHandler {

    private final RolService service;
    private final RequestValidator validator;

    public Mono<ServerResponse> crear(ServerRequest req) {
        return req.bodyToMono(RolRequest.class)
                .flatMap(validator::validate)
                .flatMap(service::crear)
                .flatMap(r -> ServerResponse.status(201).bodyValue(r));
    }

    public Mono<ServerResponse> listarTodos(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarTodos(), RolResponse.class);
    }

    public Mono<ServerResponse> listarNoSistema(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarNoSistema(), RolResponse.class);
    }

    public Mono<ServerResponse> listarSistema(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarSistema(), RolResponse.class);
    }

    public Mono<ServerResponse> buscarPorId(ServerRequest req) {
        Integer id = Integer.parseInt(req.pathVariable("id"));
        return service.buscarPorId(id)
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> actualizar(ServerRequest req) {
        Integer id = Integer.parseInt(req.pathVariable("id"));
        return req.bodyToMono(RolRequest.class)
                .flatMap(validator::validate)
                .flatMap(body -> service.actualizar(id, body))
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> eliminar(ServerRequest req) {
        Integer id = Integer.parseInt(req.pathVariable("id"));
        return service.eliminar(id)
                .then(ServerResponse.noContent().build());
    }
}
