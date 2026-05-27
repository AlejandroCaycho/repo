package com.vg.auth.web.handler;

import com.vg.auth.domain.dto.InstitucionRequest;
import com.vg.auth.domain.dto.InstitucionResponse;
import com.vg.auth.service.InstitucionService;
import com.vg.auth.util.RequestValidator;
import com.vg.auth.util.UuidUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@RequiredArgsConstructor
// DDD: Application Layer — handler HTTP para instituciones (inbound port adapter).
//
// Expone endpoints REST para CRUD de instituciones educativas,
// incluyendo activación/desactivación.
public class InstitucionHandler {

    private final InstitucionService service;
    private final RequestValidator validator;

    public Mono<ServerResponse> crear(ServerRequest req) {
        return req.bodyToMono(InstitucionRequest.class)
                .flatMap(validator::validate)
                .flatMap(service::crear)
                .flatMap(r -> ServerResponse.status(201).bodyValue(r));
    }

    public Mono<ServerResponse> listarActivas(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarActivas(), InstitucionResponse.class);
    }

    public Mono<ServerResponse> listarTodas(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarTodas(), InstitucionResponse.class);
    }

    public Mono<ServerResponse> listarPorEstado(ServerRequest req) {
        String estado = req.pathVariable("estado");
        return ServerResponse.ok()
                .body(service.listarPorEstado(estado), InstitucionResponse.class);
    }

    public Mono<ServerResponse> buscarPorId(ServerRequest req) {
        Integer id = Integer.parseInt(req.pathVariable("id"));
        return service.buscarPorId(id)
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> buscarPorUuid(ServerRequest req) {
        UUID uuid = UuidUtil.parse(req.pathVariable("uuid"));
        return service.buscarPorUuid(uuid)
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> actualizar(ServerRequest req) {
        UUID uuid = UuidUtil.parse(req.pathVariable("uuid"));
        return req.bodyToMono(InstitucionRequest.class)
                .flatMap(validator::validate)
                .flatMap(body -> service.actualizar(uuid, body))
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> desactivar(ServerRequest req) {
        UUID uuid = UuidUtil.parse(req.pathVariable("uuid"));
        return service.desactivar(uuid)
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> activar(ServerRequest req) {
        UUID uuid = UuidUtil.parse(req.pathVariable("uuid"));
        return service.activar(uuid)
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> eliminar(ServerRequest req) {
        UUID uuid = UuidUtil.parse(req.pathVariable("uuid"));
        return service.eliminar(uuid)
                .then(ServerResponse.noContent().build());
    }
}
