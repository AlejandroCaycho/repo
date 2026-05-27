package com.vg.auth.service.impl;

import com.vg.auth.domain.dto.InstitucionRequest;
import com.vg.auth.domain.dto.InstitucionResponse;
import com.vg.auth.exception.BadRequestException;
import com.vg.auth.exception.ConflictException;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.mapper.InstitucionMapper;
import com.vg.auth.repository.InstitucionRepository;
import com.vg.auth.repository.UsuarioRepository;
import com.vg.auth.service.InstitucionService;
import com.vg.auth.util.AuditHelper;
import com.vg.auth.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
@RequiredArgsConstructor
// DDD: Domain Service — gestión de entidades Institucion.
//
// Implementa los casos de uso del dominio para instituciones:
// CRUD con validación de unicidad de nombre y código modular,
// activación/desactivación con verificación de usuarios asociados.
public class InstitucionServiceImpl implements InstitucionService {

    private final InstitucionRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final InstitucionMapper mapper;
    private final AuditHelper auditHelper;

    @Override
    public Mono<InstitucionResponse> crear(InstitucionRequest request) {
        normalizar(request);
        return validarUnicosParaCrear(request)
                .then(repository.save(mapper.toModel(request)))
                .flatMap(savedInst -> auditHelper.audit("instituciones", savedInst.getId(), "INSERT", null, savedInst, savedInst))
                .map(mapper::toResponse);
    }

    @Override
    public Flux<InstitucionResponse> listarActivas() {
        return repository.findByActivaTrue()
                .map(mapper::toResponse);
    }

    @Override
    public Flux<InstitucionResponse> listarTodas() {
        return repository.findAll()
                .map(mapper::toResponse);
    }

    @Override
    public Flux<InstitucionResponse> listarPorEstado(String estado) {
        return switch (normalizarEstadoInstitucion(estado)) {
            case "activa" -> repository.findByActivaTrue().map(mapper::toResponse);
            case "inactiva" -> repository.findByActivaFalse().map(mapper::toResponse);
            default -> Flux.error(new BadRequestException("Estado invalido. Use activa o inactiva"));
        };
    }

    @Override
    public Mono<InstitucionResponse> buscarPorId(Integer id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Institucion no encontrada")))
                .map(mapper::toResponse);
    }

    @Override
    public Mono<InstitucionResponse> buscarPorUuid(UUID uuid) {
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Institucion no encontrada")))
                .map(mapper::toResponse);
    }

    @Override
    public Mono<InstitucionResponse> actualizar(UUID uuid, InstitucionRequest request) {
        normalizar(request);
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Institucion no encontrada")))
                .flatMap(inst -> validarUnicosParaActualizar(inst.getId(), request).thenReturn(inst))
                .flatMap(inst -> {
                    InstitucionResponse snapshotBefore = mapper.toResponse(inst);
                    mapper.updateModel(inst, request);
                    return repository.save(inst)
                            .flatMap(savedInst -> auditHelper.audit("instituciones", savedInst.getId(), "UPDATE", snapshotBefore, savedInst, savedInst));
                })
                .map(mapper::toResponse);
    }

    @Override
    public Mono<InstitucionResponse> desactivar(UUID uuid) {
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Institucion no encontrada")))
                .flatMap(inst -> {
                    if (Boolean.FALSE.equals(inst.getActiva())) {
                        return Mono.error(new ConflictException("La institucion ya esta inactiva"));
                    }
                    InstitucionResponse snapshotBefore = mapper.toResponse(inst);
                    inst.setActiva(false);
                    inst.setUpdatedAt(DateUtil.now());
                    return repository.save(inst)
                            .flatMap(savedInst -> auditHelper.audit("instituciones", savedInst.getId(), "UPDATE", snapshotBefore, savedInst, savedInst));
                })
                .map(mapper::toResponse);
    }

    @Override
    public Mono<InstitucionResponse> activar(UUID uuid) {
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Institucion no encontrada")))
                .flatMap(inst -> {
                    if (Boolean.TRUE.equals(inst.getActiva())) {
                        return Mono.error(new ConflictException("La institucion ya esta activa"));
                    }
                    InstitucionResponse snapshotBefore = mapper.toResponse(inst);
                    inst.setActiva(true);
                    inst.setUpdatedAt(DateUtil.now());
                    return repository.save(inst)
                            .flatMap(savedInst -> auditHelper.audit("instituciones", savedInst.getId(), "UPDATE", snapshotBefore, savedInst, savedInst));
                })
                .map(mapper::toResponse);
    }

    @Override
    public Mono<Void> eliminar(UUID uuid) {
        return repository.findByUuid(uuid)
                .switchIfEmpty(Mono.error(new NotFoundException("Institucion no encontrada")))
                .flatMap(inst -> usuarioRepository.existsByInstitucionId(inst.getId())
                        .flatMap(tieneUsuarios -> {
                            if (tieneUsuarios) {
                                return Mono.error(new ConflictException("No se puede eliminar una institucion con usuarios asociados"));
                            }
                            InstitucionResponse snapshotBefore = mapper.toResponse(inst);
                            return repository.delete(inst)
                                    .then(auditHelper.audit("institaciones", inst.getId(), "DELETE", snapshotBefore, null));
                        }))
                .then();
    }

    private Mono<Void> validarUnicosParaCrear(InstitucionRequest request) {
        return repository.existsByNombre(request.getNombre())
                .flatMap(exists -> {
                    if (exists) return Mono.error(new ConflictException("Ya existe una institucion con ese nombre"));
                    if (request.getCodigoModular() == null || request.getCodigoModular().isBlank()) return Mono.empty();
                    return repository.existsByCodigoModular(request.getCodigoModular())
                            .flatMap(codigoExiste -> codigoExiste
                                    ? Mono.error(new ConflictException("Ya existe una institucion con ese codigo modular"))
                                    : Mono.empty());
                });
    }

    private Mono<Void> validarUnicosParaActualizar(Integer id, InstitucionRequest request) {
        return repository.existsByNombreAndIdNot(request.getNombre(), id)
                .flatMap(exists -> {
                    if (exists) return Mono.error(new ConflictException("Ya existe una institucion con ese nombre"));
                    if (request.getCodigoModular() == null || request.getCodigoModular().isBlank()) return Mono.empty();
                    return repository.existsByCodigoModularAndIdNot(request.getCodigoModular(), id)
                            .flatMap(codigoExiste -> codigoExiste
                                    ? Mono.error(new ConflictException("Ya existe una institucion con ese codigo modular"))
                                    : Mono.empty());
                });
    }

    private void normalizar(InstitucionRequest request) {
        request.setNombre(trim(request.getNombre()));
        request.setEmail(lower(trim(request.getEmail())));
        request.setCodigoModular(trim(request.getCodigoModular()));
        request.setPais(trim(request.getPais()));
    }

    private String normalizarEstadoInstitucion(String estado) {
        String value = lower(trim(estado));
        if ("activo".equals(value)) return "activa";
        if ("inactivo".equals(value)) return "inactiva";
        return value;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String lower(String value) {
        return value == null ? null : value.toLowerCase();
    }
}
