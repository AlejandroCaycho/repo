package com.vg.auth.web.handler;

import com.vg.auth.domain.dto.PermisoRequest;
import com.vg.auth.domain.dto.PermisoResponse;
import com.vg.auth.domain.dto.RolPermisoRequest;
import com.vg.auth.service.PermisoService;
import com.vg.auth.util.RequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
@RequiredArgsConstructor
// DDD: Application Layer — handler HTTP para permisos (inbound port adapter).
//
// Expone endpoints REST para CRUD de permisos y asignación/remoción
// de permisos a roles.
public class PermisoHandler {

    private final PermisoService service;
    private final RequestValidator validator;

    public Mono<ServerResponse> crear(ServerRequest req) {
        return req.bodyToMono(PermisoRequest.class)
                .flatMap(validator::validate)
                .flatMap(service::crear)
                .flatMap(r -> ServerResponse.status(201).bodyValue(r));
    }

    public Mono<ServerResponse> listarTodos(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarTodos(), PermisoResponse.class);
    }

    public Mono<ServerResponse> listarPorModulo(ServerRequest req) {
        String modulo = req.pathVariable("modulo");
        return ServerResponse.ok()
                .body(service.listarPorModulo(modulo), PermisoResponse.class);
    }

    public Mono<ServerResponse> listarPorRol(ServerRequest req) {
        Integer rolId = Integer.parseInt(req.pathVariable("rolId"));
        return ServerResponse.ok()
                .body(service.listarPorRol(rolId), PermisoResponse.class);
    }

    public Mono<ServerResponse> buscarPorId(ServerRequest req) {
        Integer id = Integer.parseInt(req.pathVariable("id"));
        return service.buscarPorId(id)
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> actualizar(ServerRequest req) {
        Integer id = Integer.parseInt(req.pathVariable("id"));
        return req.bodyToMono(PermisoRequest.class)
                .flatMap(validator::validate)
                .flatMap(body -> service.actualizar(id, body))
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> eliminar(ServerRequest req) {
        Integer id = Integer.parseInt(req.pathVariable("id"));
        return service.eliminar(id)
                .then(ServerResponse.noContent().build());
    }

    public Mono<ServerResponse> cambiarEstado(ServerRequest req) {
        Integer id = Integer.parseInt(req.pathVariable("id"));
        return req.bodyToMono(Map.class)
                .flatMap(body -> {
                    String estado = (String) body.get("estado");
                    return service.cambiarEstado(id, estado);
                })
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> asignarPermiso(ServerRequest req) {
        return req.bodyToMono(RolPermisoRequest.class)
                .flatMap(validator::validate)
                .flatMap(body -> service.asignarPermiso(body.getRolId(), body.getPermisoId()))
                .then(ServerResponse.noContent().build());
    }

    public Mono<ServerResponse> quitarPermiso(ServerRequest req) {
        return req.bodyToMono(RolPermisoRequest.class)
                .flatMap(validator::validate)
                .flatMap(body -> service.quitarPermiso(body.getRolId(), body.getPermisoId()))
                .then(ServerResponse.noContent().build());
    }

    public Mono<ServerResponse> quitarPermisoPorRuta(ServerRequest req) {
        Integer rolId = Integer.parseInt(req.pathVariable("rolId"));
        Integer permisoId = Integer.parseInt(req.pathVariable("permisoId"));
        return service.quitarPermiso(rolId, permisoId)
                .then(ServerResponse.noContent().build());
    }
}
