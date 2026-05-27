package com.vg.auth.service.impl;

import com.vg.auth.domain.dto.UsuarioRolRequest;
import com.vg.auth.domain.dto.UsuarioRolResponse;
import com.vg.auth.exception.ConflictException;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.mapper.UsuarioRolMapper;
import com.vg.auth.repository.RolRepository;
import com.vg.auth.repository.UsuarioRepository;
import com.vg.auth.repository.UsuarioRolRepository;
import com.vg.auth.service.UsuarioRolService;
import com.vg.auth.util.AuditHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
// DDD: Domain Service — asignación y remoción de roles a usuarios.
//
// Implementa los casos de uso del dominio para gestionar
// la asignación de roles a usuarios, validando que el usuario
// esté activo y que el rol exista.
public class UsuarioRolServiceImpl implements UsuarioRolService {

    private final UsuarioRolRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final UsuarioRolMapper mapper;
    private final AuditHelper auditHelper;

    @Override
    public Mono<UsuarioRolResponse> asignarRol(UsuarioRolRequest request) {
        return usuarioRepository.findById(request.getUsuarioId())
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .flatMap(usuario -> {
                    if (!"activo".equals(usuario.getEstado())) {
                        return Mono.error(new ConflictException("No se puede asignar rol a un usuario inactivo o bloqueado"));
                    }
                    return rolRepository.existsById(request.getRolId());
                })
                .flatMap(rolExiste -> {
                    if (!rolExiste) return Mono.error(new NotFoundException("Rol no encontrado"));
                    return repository.existsByUsuarioIdAndRolId(request.getUsuarioId(), request.getRolId());
                })
                .flatMap(yaAsignado -> {
                    if (yaAsignado) return Mono.error(new ConflictException("El usuario ya tiene ese rol asignado"));
                    var usuarioRol = mapper.toModel(request);
                    return repository.insert(
                                    usuarioRol.getUsuarioId(),
                                    usuarioRol.getRolId(),
                                    usuarioRol.getAsignadoPor(),
                                    usuarioRol.getAsignadoEn()
                            )
                            .flatMap(rows -> auditHelper.audit("usuario_roles", usuarioRol.getUsuarioId(), "INSERT", null, usuarioRol, usuarioRol))
                            .thenReturn(usuarioRol);
                })
                .map(mapper::toResponse);
    }

    @Override
    public Flux<UsuarioRolResponse> listarTodos() {
        return repository.findAll()
                .map(mapper::toResponse);
    }

    @Override
    public Flux<UsuarioRolResponse> listarRolesPorUsuario(Integer usuarioId) {
        return usuarioRepository.existsById(usuarioId)
                .flatMapMany(existe -> {
                    if (!existe) return Flux.error(new NotFoundException("Usuario no encontrado"));
                    return repository.findByUsuarioId(usuarioId);
                })
                .map(mapper::toResponse);
    }

    @Override
    public Flux<UsuarioRolResponse> listarUsuariosPorRol(Integer rolId) {
        return rolRepository.existsById(rolId)
                .flatMapMany(existe -> {
                    if (!existe) return Flux.error(new NotFoundException("Rol no encontrado"));
                    return repository.findByRolId(rolId);
                })
                .map(mapper::toResponse);
    }

    @Override
    public Mono<Void> quitarRol(Integer usuarioId, Integer rolId) {
        return repository.findByUsuarioIdAndRolId(usuarioId, rolId)
                .switchIfEmpty(Mono.error(new NotFoundException("Asignacion no encontrada")))
                .flatMap(assignment -> {
                    final String snapshotBefore = auditHelper.serialize(assignment);
                    return repository.deleteByUsuarioIdAndRolId(usuarioId, rolId)
                            .flatMap(rows -> auditHelper.audit("usuario_roles", usuarioId, "DELETE", snapshotBefore, null));
                })
                .then();
    }
}
