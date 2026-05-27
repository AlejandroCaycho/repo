package com.vg.auth.service.impl;

import com.vg.auth.domain.dto.UsuarioRequest;
import com.vg.auth.domain.dto.UsuarioResponse;
import com.vg.auth.domain.model.ContrasenaHash;
import com.vg.auth.domain.model.Email;
import com.vg.auth.domain.model.EstadoUsuario;
import com.vg.auth.exception.BadRequestException;
import com.vg.auth.exception.ConflictException;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.mapper.UsuarioMapper;
import com.vg.auth.repository.InstitucionRepository;
import com.vg.auth.repository.UsuarioRepository;
import com.vg.auth.repository.UsuarioRolRepository;
import com.vg.auth.service.UsuarioService;
import com.vg.auth.util.AuditHelper;
import com.vg.auth.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.core.io.buffer.DataBufferUtils;

// DDD: Domain Service — gestión de usuarios.
//
// Implementa los casos de uso de gestión de usuarios del dominio:
// CRUD de usuarios, activación/desactivación, subida de fotos de perfil.
//
// Utiliza Value Objects (Email, ContrasenaHash, EstadoUsuario)
// para validación de datos de entrada.
@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository repository;
    private final InstitucionRepository institucionRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final UsuarioMapper mapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuditHelper auditHelper;

    @Value("${app.upload-dir:./uploads/perfiles}")
    private String uploadDir;

    @Override
    public Mono<UsuarioResponse> crear(UsuarioRequest request) {
        normalizar(request);
        // DDD: Value Object Email — validación de formato antes de persistir
        Email emailVO = new Email(request.getEmail());
        return institucionRepository.findById(request.getInstitucionId())
                .switchIfEmpty(Mono.error(new NotFoundException("Institucion no encontrada")))
                .flatMap(inst -> {
                    // DDD: Usar comportamiento de entidad Institucion
                    if (!inst.estaActiva()) {
                        return Mono.error(new ConflictException("No se puede crear usuarios en una institucion inactiva"));
                    }
                    return repository.existsByInstitucionIdAndEmail(request.getInstitucionId(), emailVO.value());
                })
                .flatMap(exists -> {
                    if (exists) return Mono.error(new ConflictException("Email ya registrado en esta institucion"));
                    // DDD: Value Object ContrasenaHash — encapsula el hash BCrypt
                    ContrasenaHash hash = new ContrasenaHash(passwordEncoder.encode(request.getContrasena()));
                    return repository.save(mapper.toModel(request, hash.value()));
                })
                .flatMap(savedUser -> auditHelper.audit("usuarios", savedUser.getId(), "INSERT", null, savedUser, savedUser))
                .map(mapper::toResponse);
    }

    @Override
    public Flux<UsuarioResponse> listarTodos() {
        return repository.findAll()
                .map(mapper::toResponse);
    }

    @Override
    public Flux<UsuarioResponse> listarPorInstitucion(Integer institucionId) {
        return repository.findByInstitucionId(institucionId)
                .map(mapper::toResponse);
    }

    @Override
    public Flux<UsuarioResponse> listarPorEstado(String estado) {
        // DDD: Value Object EstadoUsuario — valida el estado antes de consultar
        EstadoUsuario estadoVO = new EstadoUsuario(estado);
        return repository.findByEstado(estadoVO.value())
                .map(mapper::toResponse);
    }

    @Override
    public Flux<UsuarioResponse> listarPorInstitucionYEstado(Integer institucionId, String estado) {
        // DDD: Value Object EstadoUsuario — valida el estado antes de consultar
        EstadoUsuario estadoVO = new EstadoUsuario(estado);
        return repository.findByInstitucionIdAndEstado(institucionId, estadoVO.value())
                .map(mapper::toResponse);
    }

    @Override
    public Mono<UsuarioResponse> buscarPorId(Integer id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .map(mapper::toResponse);
    }

    @Override
    public Mono<UsuarioResponse> buscarPorUuid(UUID uuid) {
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .map(mapper::toResponse);
    }

    @Override
    public Mono<UsuarioResponse> actualizar(UUID uuid, UsuarioRequest request) {
        normalizar(request);
        // DDD: Value Object Email — validación de formato
        Email emailVO = new Email(request.getEmail());
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .flatMap(u -> institucionRepository.findById(request.getInstitucionId())
                        .switchIfEmpty(Mono.error(new NotFoundException("Institucion no encontrada")))
                        .flatMap(inst -> {
                            // DDD: Usar comportamiento de entidad Institucion
                            if (!inst.estaActiva()) {
                                    return Mono.error(new ConflictException("La institucion no esta activa"));
                            }
                            if (!u.getEmail().equals(emailVO.value()) || !u.getInstitucionId().equals(request.getInstitucionId())) {
                                return repository.existsByInstitucionIdAndEmail(request.getInstitucionId(), emailVO.value())
                                        .flatMap(exists -> {
                                            if (exists) {
                                                return Mono.error(new ConflictException("Email ya registrado en esta institucion"));
                                            }
                                            return Mono.just(u);
                                        });
                            }
                            return Mono.just(u);
                        })
                        .flatMap(user -> {
                            UsuarioResponse snapshotBefore = mapper.toResponse(user);
                            mapper.updateModel(user, request);
                            return repository.save(user)
                                    .flatMap(savedUser -> auditHelper.audit("usuarios", savedUser.getId(), "UPDATE", snapshotBefore, savedUser, savedUser));
                        })
                )
                .map(mapper::toResponse);
    }

    @Override
    public Mono<UsuarioResponse> desactivar(UUID uuid) {
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .flatMap(u -> {
                    // DDD: Value Object EstadoUsuario — validación semántica del estado
                    EstadoUsuario estado = new EstadoUsuario(u.getEstado());
                    if (!estado.puedeDesactivar()) {
                        return Mono.error(new ConflictException("El usuario ya esta inactivo"));
                    }
                    UsuarioResponse snapshotBefore = mapper.toResponse(u);
                    u.setEstado(estado.desactivar());
                    u.setUpdatedAt(DateUtil.now());
                    return repository.save(u)
                            .flatMap(savedUser -> auditHelper.audit("usuarios", savedUser.getId(), "UPDATE", snapshotBefore, savedUser, savedUser));
                })
                .map(mapper::toResponse);
    }

    @Override
    public Mono<UsuarioResponse> activar(UUID uuid) {
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .flatMap(u -> {
                    // DDD: Value Object EstadoUsuario — validación semántica del estado
                    EstadoUsuario estado = new EstadoUsuario(u.getEstado());
                    if (!estado.puedeActivar()) {
                        return Mono.error(new ConflictException("El usuario ya esta activo"));
                    }
                    UsuarioResponse snapshotBefore = mapper.toResponse(u);
                    u.setEstado(estado.activar());
                    u.setUpdatedAt(DateUtil.now());
                    return repository.save(u)
                            .flatMap(savedUser -> auditHelper.audit("usuarios", savedUser.getId(), "UPDATE", snapshotBefore, savedUser, savedUser));
                })
                .map(mapper::toResponse);
    }

    @Override
    public Mono<Void> eliminar(UUID uuid) {
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .flatMap(usuario -> usuarioRolRepository.existsByUsuarioId(usuario.getId())
                        .flatMap(tieneRoles -> {
                            if (tieneRoles) {
                                return Mono.error(new ConflictException("No se puede eliminar un usuario con roles asignados"));
                            }
                            UsuarioResponse snapshotBefore = mapper.toResponse(usuario);
                            return repository.delete(usuario)
                                    .then(auditHelper.audit("usuarios", usuario.getId(), "DELETE", snapshotBefore, null));
                        }))
                .then();
    }

    @Override
    public Mono<UsuarioResponse> subirFoto(UUID uuid, FilePart file) {
        String original = file.filename();
        String extension = "";
        int dot = original.lastIndexOf('.');
        if (dot > 0) {
            extension = original.substring(dot).toLowerCase();
        }
        if (!extension.matches("\\.(jpg|jpeg|png|gif|webp)$")) {
            return Mono.error(new BadRequestException("Formato no permitido. Use jpg, jpeg, png, gif o webp"));
        }
        String filename = UUID.randomUUID().toString() + extension;
        Path targetPath = Path.of(uploadDir, filename).normalize();

        return DataBufferUtils.join(file.content())
                .flatMap(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);
                    try {
                        Files.createDirectories(targetPath.getParent());
                        Files.write(targetPath, bytes);
                    } catch (IOException e) {
                        return Mono.error(new RuntimeException("Error al guardar el archivo", e));
                    }
                    String fotoUrl = filename;
                    return repository.findByUuid(uuid)
                            .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                            .flatMap(user -> {
                                UsuarioResponse snapshotBefore = mapper.toResponse(user);
                                user.setFotoUrl(fotoUrl);
                                user.setUpdatedAt(DateUtil.now());
                                return repository.save(user)
                                        .flatMap(savedUser -> auditHelper.audit(
                                                "usuarios", savedUser.getId(), "UPDATE", snapshotBefore, savedUser, savedUser));
                            })
                            .map(mapper::toResponse);
                });
    }

    private String normalizarEstadoUsuario(String estado) {
        String value = estado == null ? "" : estado.trim().toLowerCase();
        // DDD: Value Object EstadoUsuario — validación centralizada
        new EstadoUsuario(value);
        return value;
    }

    private void normalizar(UsuarioRequest request) {
        request.setNombre(trim(request.getNombre()));
        request.setEmail(lower(trim(request.getEmail())));
        request.setTelefono(trim(request.getTelefono()));
        request.setFotoUrl(trim(request.getFotoUrl()));
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String lower(String value) {
        return value == null ? null : value.toLowerCase();
    }
}
