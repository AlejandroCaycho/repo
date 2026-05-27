package com.vg.auth.web.handler;

import com.vg.auth.domain.dto.UsuarioRequest;
import com.vg.auth.domain.dto.UsuarioResponse;
import com.vg.auth.exception.BadRequestException;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.service.UsuarioService;
import com.vg.auth.util.RequestValidator;
import com.vg.auth.util.UuidUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Component
@RequiredArgsConstructor
// DDD: Application Layer — handler HTTP para usuarios (inbound port adapter).
//
// Expone endpoints REST para CRUD de usuarios, activación/desactivación,
// y subida/descarga de fotos de perfil.
public class UsuarioHandler {

    private final UsuarioService service;
    private final RequestValidator validator;

    @Value("${app.upload-dir:./uploads/perfiles}")
    private String uploadDir;

    public Mono<ServerResponse> crear(ServerRequest req) {
        return req.bodyToMono(UsuarioRequest.class)
                .flatMap(validator::validate)
                .flatMap(service::crear)
                .flatMap(r -> ServerResponse.status(201).bodyValue(r));
    }

    public Mono<ServerResponse> listarTodos(ServerRequest req) {
        return ServerResponse.ok()
                .body(service.listarTodos(), UsuarioResponse.class);
    }

    public Mono<ServerResponse> listarPorInstitucion(ServerRequest req) {
        Integer institucionId = Integer.parseInt(req.pathVariable("institucionId"));
        return ServerResponse.ok()
                .body(service.listarPorInstitucion(institucionId), UsuarioResponse.class);
    }

    public Mono<ServerResponse> listarPorEstado(ServerRequest req) {
        String estado = req.pathVariable("estado");
        return ServerResponse.ok()
                .body(service.listarPorEstado(estado), UsuarioResponse.class);
    }

    public Mono<ServerResponse> listarPorInstitucionYEstado(ServerRequest req) {
        Integer institucionId = Integer.parseInt(req.pathVariable("institucionId"));
        String estado = req.pathVariable("estado");
        return ServerResponse.ok()
                .body(service.listarPorInstitucionYEstado(institucionId, estado), UsuarioResponse.class);
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
        return req.bodyToMono(UsuarioRequest.class)
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

    public Mono<ServerResponse> obtenerFoto(ServerRequest req) {
        UUID uuid = UuidUtil.parse(req.pathVariable("uuid"));
        return service.buscarPorUuid(uuid)
                .flatMap(user -> {
                    String fotoUrl = user.getFotoUrl();
                    if (fotoUrl == null || fotoUrl.isBlank()) {
                        return Mono.error(new NotFoundException("El usuario no tiene foto"));
                    }
                    String filename = fotoUrl.substring(fotoUrl.lastIndexOf('/') + 1);
                    Path filePath = Path.of(uploadDir, filename).normalize();
                    if (!Files.exists(filePath)) {
                        return Mono.error(new NotFoundException("Archivo de foto no encontrado"));
                    }
                    Resource resource = new FileSystemResource(filePath);
                    String contentType = detectContentType(filename);
                    return ServerResponse.ok()
                            .contentType(MediaType.parseMediaType(contentType))
                            .body(BodyInserters.fromResource(resource));
                });
    }

    private String detectContentType(String filename) {
        String name = filename.toLowerCase();
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    public Mono<ServerResponse> subirFoto(ServerRequest req) {
        UUID uuid = UuidUtil.parse(req.pathVariable("uuid"));
        return req.multipartData()
                .flatMap(map -> {
                    Part part = map.getFirst("foto");
                    if (part == null) {
                        return Mono.error(new BadRequestException("El campo 'foto' es obligatorio"));
                    }
                    if (!(part instanceof FilePart filePart)) {
                        return Mono.error(new BadRequestException("El campo 'foto' debe ser un archivo"));
                    }
                    return service.subirFoto(uuid, filePart);
                })
                .flatMap(r -> ServerResponse.ok().bodyValue(r));
    }
}
