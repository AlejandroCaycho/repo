package com.vg.auth.service.impl;

import com.vg.auth.domain.dto.RolRequest;
import com.vg.auth.domain.dto.RolResponse;
import com.vg.auth.exception.ConflictException;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.mapper.RolMapper;
import com.vg.auth.repository.RolPermisoRepository;
import com.vg.auth.repository.RolRepository;
import com.vg.auth.repository.UsuarioRolRepository;
import com.vg.auth.service.RolService;
import com.vg.auth.util.AuditHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Domain Service — gestión de entidades Rol.
//
// Implementa los casos de uso del dominio para roles:
// CRUD con validación de unicidad de nombre y protección
// de roles de sistema (no modificables ni eliminables).
//
// Incluye auditoría de todas las operaciones.
@Service
@RequiredArgsConstructor
public class RolServiceImpl implements RolService {

    private final RolRepository repository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final RolMapper mapper;
    private final AuditHelper auditHelper;

    // DDD: Comando de negocio — crear un nuevo rol.
    @Override
    public Mono<RolResponse> crear(RolRequest request) {
        normalizar(request);
        request.setEsSistema(false);
        // DDD: Usar comportamiento de entidad Rol — validar unicidad de nombre
        return repository.existsByNombre(request.getNombre())
                .flatMap(exists -> {
                    if (exists) return Mono.error(new ConflictException("Ya existe un rol con ese nombre"));
                    return repository.save(mapper.toModel(request));
                })
                .flatMap(savedRol -> auditHelper.audit("roles", savedRol.getId(), "INSERT", null, savedRol, savedRol))
                .map(mapper::toResponse);
    }

    // DDD: Consulta — listar todos los roles.
    @Override
    public Flux<RolResponse> listarTodos() {
        return repository.findAll()
                .map(mapper::toResponse);
    }

    // DDD: Consulta — listar roles que no son de sistema.
    @Override
    public Flux<RolResponse> listarNoSistema() {
        return repository.findByEsSistemaFalse()
                .map(mapper::toResponse);
    }

    // DDD: Consulta — listar roles de sistema.
    @Override
    public Flux<RolResponse> listarSistema() {
        return repository.findByEsSistemaTrue()
                .map(mapper::toResponse);
    }

    // DDD: Consulta — buscar rol por ID.
    @Override
    public Mono<RolResponse> buscarPorId(Integer id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Rol no encontrado")))
                .map(mapper::toResponse);
    }

    // DDD: Comando de negocio — actualizar datos del rol (solo roles no sistema).
    @Override
    public Mono<RolResponse> actualizar(Integer id, RolRequest request) {
        normalizar(request);
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Rol no encontrado")))
                .flatMap(rol -> {
                    // DDD: Regla de negocio — roles de sistema no se modifican
                    if (Boolean.TRUE.equals(rol.getEsSistema())) {
                        return Mono.error(new ConflictException("No se puede modificar un rol de sistema"));
                    }
                    return repository.existsByNombreAndIdNot(request.getNombre(), id).flatMap(exists -> {
                        if (exists) return Mono.error(new ConflictException("Ya existe un rol con ese nombre"));
                        RolResponse snapshotBefore = mapper.toResponse(rol);
                        mapper.updateModel(rol, request);
                        return repository.save(rol)
                                .flatMap(savedRol -> auditHelper.audit("roles", savedRol.getId(), "UPDATE", snapshotBefore, savedRol, savedRol));
                    });
                })
                .map(mapper::toResponse);
    }

    // DDD: Comando de negocio — eliminar un rol (solo roles no sistema).
    @Override
    public Mono<Void> eliminar(Integer id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Rol no encontrado")))
                .flatMap(rol -> {
                    // DDD: Regla de negocio — roles de sistema no se eliminan
                    if (Boolean.TRUE.equals(rol.getEsSistema())) {
                        return Mono.error(new ConflictException("No se puede eliminar un rol de sistema"));
                    }
                    RolResponse snapshotBefore = mapper.toResponse(rol);
                    return rolPermisoRepository.deleteByRolId(id)
                            .then(usuarioRolRepository.deleteByRolId(id))
                            .then(repository.delete(rol))
                            .then(auditHelper.audit("roles", rol.getId(), "DELETE", snapshotBefore, null));
                })
                .then();
    }

    private void normalizar(RolRequest request) {
        request.setNombre(request.getNombre() == null ? null : request.getNombre().trim().toUpperCase());
        request.setDescripcion(request.getDescripcion() == null ? null : request.getDescripcion().trim());
    }
}
