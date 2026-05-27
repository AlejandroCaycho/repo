package com.vg.auth.web.handler;

import com.vg.auth.domain.dto.ConfiguracionInstitucionRequest;
import com.vg.auth.domain.dto.ConfiguracionInstitucionResponse;
import com.vg.auth.service.ConfiguracionInstitucionService;
import com.vg.auth.util.RequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
// DDD: Application Layer — handler HTTP para configuración de institución.
//
// Expone endpoints REST para gestionar la configuración
// específica de cada institución educativa.
public class ConfiguracionInstitucionHandler {

    private final ConfiguracionInstitucionService service;
    private final RequestValidator validator;

    public Mono<ServerResponse> crear(ServerRequest req) {
        return req.bodyToMono(ConfiguracionInstitucionRequest.class)
                .flatMap(validator::validate)
                .flatMap(service::crear)
                .flatMap(r -> ServerResponse.status(201).bodyValue(r));
    }

    public Mono<ServerResponse> listarTodas(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarTodas(), ConfiguracionInstitucionResponse.class);
    }

    public Mono<ServerResponse> buscarPorInstitucionId(ServerRequest req) {
        Integer institucionId = Integer.parseInt(req.pathVariable("institucionId"));
        return service.buscarPorInstitucionId(institucionId)
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> actualizar(ServerRequest req) {
        Integer institucionId = Integer.parseInt(req.pathVariable("institucionId"));
        return req.bodyToMono(ConfiguracionInstitucionRequest.class)
                .doOnNext(body -> body.setInstitucionId(institucionId))
                .flatMap(validator::validate)
                .flatMap(body -> service.actualizar(institucionId, body))
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }

    public Mono<ServerResponse> eliminar(ServerRequest req) {
        Integer institucionId = Integer.parseInt(req.pathVariable("institucionId"));
        return service.eliminar(institucionId)
                .then(ServerResponse.noContent().build());
    }
}
